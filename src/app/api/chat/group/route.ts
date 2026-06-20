/**
 * 단체방 메시지 전송 + 9명 단체 응답 생성.
 *
 * POST /api/chat/group
 *   body: { content: string }
 *   -> JSON { turns: [{ speaker, name, content }] }
 *
 * - 한 번의 모델 호출로 단체 대화를 만들고, 멤버별 말투를 자연스럽게 연결한다.
 * - 단체방은 일일 chat 한도에서 2회 차감한다.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import { db } from "@/db";
import { chatMessages, type ChatMessage } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { checkRateLimit } from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS, AI_MODELS } from "@/lib/constants";
import { getAnthropic } from "@/lib/ai/anthropic";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import {
  buildGroupSystemPrompt,
  detectGroupMention,
  parseGroupScript,
  groupFallbackTurn,
  type GroupTurn,
} from "@/lib/chat/group";
import {
  findOrCreateGroupSession,
  getGroupMessages,
  buildGroupApiMessages,
  buildGroupRecentMemory,
  saveGroupTurns,
} from "@/lib/chat/group-service";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** 단체방 1회당 chat 한도 차감량. */
const GROUP_QUESTION_COST = 2;
const GROUP_PHOTO_COST = 3;
const MAX_IMAGE_BASE64_CHARS = 3_500_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const IMAGE_SAFETY_MODEL = AI_MODELS.fast;

const bodySchema = z.object({
  content: z
    .string()
    .max(100, "메시지는 100자 이내로 부탁해.")
    .optional()
    .default(""),
  image: z
    .object({
      dataUrl: z.string().min(32).max(MAX_IMAGE_BASE64_CHARS),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    })
    .optional(),
}).refine((v) => v.content.trim().length > 0 || !!v.image, {
  message: "메시지나 사진을 보내줘.",
});

function imageDataFromDataUrl(dataUrl: string, mimeType: string): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== mimeType) return null;
  return match[2];
}

type ImageSafetyCategory =
  | "safe"
  | "sexual"
  | "minor_sexual"
  | "political"
  | "private_info"
  | "violence"
  | "self_harm"
  | "unknown_sensitive";

interface ImageSafetyResult {
  category: ImageSafetyCategory;
  confidence: "low" | "medium" | "high";
}

function parseImageSafety(text: string): ImageSafetyResult {
  try {
    const json = JSON.parse(text.replace(/```json|```/g, "").trim()) as Partial<ImageSafetyResult>;
    const category =
      json.category === "safe" ||
      json.category === "sexual" ||
      json.category === "minor_sexual" ||
      json.category === "political" ||
      json.category === "private_info" ||
      json.category === "violence" ||
      json.category === "self_harm" ||
      json.category === "unknown_sensitive"
        ? json.category
        : "unknown_sensitive";
    const confidence =
      json.confidence === "low" || json.confidence === "medium" || json.confidence === "high"
        ? json.confidence
        : "medium";
    return { category, confidence };
  } catch {
    return { category: "unknown_sensitive", confidence: "medium" };
  }
}

async function classifyGroupImageSafety(opts: {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  userText: string;
}): Promise<ImageSafetyResult> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: IMAGE_SAFETY_MODEL,
    max_tokens: 120,
    system:
      "You are an image safety classifier for a Korean virtual idol group chat. " +
      "Classify the image conservatively. Return only compact JSON with keys category and confidence. " +
      "Categories: safe, sexual, minor_sexual, political, private_info, violence, self_harm, unknown_sensitive. " +
      "Use sexual for nudity, eroticized poses, NSFW labels, or explicit sexual context. " +
      "Use political for candidates, parties, elections, rallies, campaign posters, or political persuasion. " +
      "Use private_info for IDs, cards, account screens, addresses, phone numbers, or secrets. " +
      "If uncertain between safe and sensitive, choose unknown_sensitive.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `User text: ${opts.userText || "(none)"}\nClassify this image.`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: opts.mimeType,
              data: opts.imageBase64,
            },
          },
        ],
      },
    ],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return parseImageSafety(text);
}

function safetyTurns(category: ImageSafetyCategory): GroupTurn[] | null {
  if (category === "safe") return null;
  if (category === "political") {
    return [
      { speaker: "child", name: "이안", text: "정치 쪽 사진은 우리가 누구 편을 들거나 판단하긴 어려워." },
      { speaker: "hunter", name: "이현", text: "구도나 색감 정도는 말할 수 있는데, 지지·비판은 안 하는 게 맞음." },
      { speaker: "taoist", name: "하루", text: "다른 사진 보내주면 우리 바로 봐줄게ㅎㅎ" },
    ];
  }
  if (category === "private_info") {
    return [
      { speaker: "child", name: "이안", text: "이 사진엔 민감한 정보가 보일 수 있어서 읽어주긴 어려워." },
      { speaker: "hunter", name: "이현", text: "카드번호나 주소 같은 건 올리기 전에 꼭 가려." },
      { speaker: "taoist", name: "하루", text: "응응, 이런 건 바로 삭제하고 다시 보내줘!" },
    ];
  }
  if (category === "violence" || category === "self_harm") {
    return [
      { speaker: "witch", name: "유준", text: "이 사진은 자세히 얘기하기엔 조금 조심스러워." },
      { speaker: "child", name: "이안", text: "지금 위험한 상황이면 혼자 보지 말고 가까운 사람이나 도움 받을 수 있는 곳에 바로 말해줘." },
    ];
  }
  return [
    { speaker: "child", name: "이안", text: "이 사진은 단톡방에서 자세히 얘기하긴 어려워." },
    { speaker: "runeshaman", name: "하민", text: "다른 사진 보내주면 내가 부드럽게 봐줄게." },
    { speaker: "witch", name: "유준", text: "괜찮아, 사진만 바꿔서 다시 보내줘." },
  ];
}

function groupLocaleDirective(locale: string): string {
  if (locale !== "en" && locale !== "ja") return "";
  const language = locale === "ja" ? "Japanese" : "English";
  const riderName = locale === "ja" ? "ライダー" : "Rider";
  return `

[GROUP CHAT LANGUAGE OVERRIDE]
Write every dialogue message in natural ${language}.
However, keep speaker labels exactly in Korean for parsing:
[이안], [유준], [도윤], [재하], [하루], [시온], [태오], [이현], [하민].
Do not translate the bracketed speaker labels. Only translate the dialogue after the label.
Address the fan as "${riderName}" by default. If a personal name is absolutely necessary, use only the given name, never the family name or full name.
Except for those bracketed labels, do not output Korean in the dialogue.`;
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return jsonError(400, API_ERROR_CODES.VALIDATION_FAILED, "요청을 읽지 못했어요.");
  }
  if (!parsed.success) {
    return jsonError(
      400,
      API_ERROR_CODES.VALIDATION_FAILED,
      parsed.error.issues[0]?.message ?? "입력값을 확인해줘.",
    );
  }

  const { profile } = await requireProfile();
  const content = parsed.data.content.trim();
  const mentioned = detectGroupMention(content);
  const imageBase64 = parsed.data.image
    ? imageDataFromDataUrl(parsed.data.image.dataUrl, parsed.data.image.mimeType)
    : null;
  if (parsed.data.image && !imageBase64) {
    return jsonError(400, API_ERROR_CODES.VALIDATION_FAILED, "이미지 형식을 확인해줘.");
  }

  // 부당 burst 제한.
  const rl = checkRateLimit(`group:${profile.userId}`, 15, 60_000);
  if (!rl.ok) {
    return jsonError(429, API_ERROR_CODES.QUOTA_EXCEEDED, "너무 빠르게 보내고 있어. 잠시 후 다시 보내줘.");
  }

  const imageSafety =
    parsed.data.image && imageBase64
      ? await classifyGroupImageSafety({
          imageBase64,
          mimeType: parsed.data.image.mimeType,
          userText: content,
        }).catch(() => ({ category: "unknown_sensitive" as const, confidence: "medium" as const }))
      : null;
  const blockedTurns = imageSafety ? safetyTurns(imageSafety.category) : null;
  if (blockedTurns) {
    const session = await findOrCreateGroupSession(profile.userId);
    await db.insert(chatMessages).values({
      sessionId: session.id,
      userId: profile.userId,
      role: "user",
      content: `${content || "사진을 올렸어요."}\n[사진 첨부 차단: ${imageSafety?.category ?? "unknown_sensitive"}]`,
    });
    await saveGroupTurns({
      sessionId: session.id,
      userId: profile.userId,
      turns: blockedTurns,
      model: "image-safety-gate",
    });
    return NextResponse.json({
      turns: blockedTurns.map((t) => ({ speaker: t.speaker, name: t.name, content: t.text })),
      safety: imageSafety,
      charged: 0,
    });
  }

  // 단톡방은 대화 횟수를 2회 사용하므로 검사와 차감을 한 번에 처리한다.
  const quota = await checkAndIncrementQuota({
    userId: profile.userId,
    kind: "chat",
    max: FREE_DAILY_LIMITS.chat,
    amount: parsed.data.image ? GROUP_PHOTO_COST : GROUP_QUESTION_COST,
  });
  if (!quota.ok) {
    return jsonError(
      429,
      API_ERROR_CODES.QUOTA_EXCEEDED,
      parsed.data.image
        ? "사진 단톡은 대화 횟수를 3회 사용해요. 오늘 남은 대화 횟수가 부족합니다."
        : "단톡방은 대화 횟수를 2회 사용해요. 오늘 남은 대화 횟수가 부족합니다.",
    );
  }

  const session = await findOrCreateGroupSession(profile.userId);

  // 사용자 메시지 저장.
  await db.insert(chatMessages).values({
    sessionId: session.id,
    userId: profile.userId,
    role: "user",
    content: parsed.data.image
      ? `${content || "사진을 올렸어요."}\n[사진 첨부: 원본은 저장하지 않고 멤버 반응 생성에만 사용함]`
      : content,
  });

  // 기존 대화를 모델 입력 messages로 변환.
  const history: ChatMessage[] = await getGroupMessages(session.id);
  const apiMessages = buildGroupApiMessages(history);
  const groupMemory = buildGroupRecentMemory(history);
  if (parsed.data.image && imageBase64 && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1];
    if (last?.role === "user") {
      last.content = [
        {
          type: "text",
          text:
            `${content || "사진을 올렸어요."}\n\n` +
            "첨부된 사진을 보고 Carousel Nine 단체방 멤버들이 자연스럽게 반응해줘. " +
            "민감하거나 부적절한 사진이면 안전 규칙에 따라 짧고 부드럽게 거절해." +
            (mentioned ? ` 이번 메시지는 ${mentioned.name}을(를) 직접 부른 상황이므로 ${mentioned.name}이(가) 먼저 반응해야 해.` : ""),
        },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: parsed.data.image.mimeType,
            data: imageBase64,
          },
        },
      ];
    }
  }

  const biasName = profile.biasCharacter
    ? CHARACTERS[profile.biasCharacter as CharacterId]?.name ?? null
    : null;
  const system = buildGroupSystemPrompt({
    userName: profile.displayName ?? null,
    biasName,
    mentionedName: mentioned?.name ?? null,
  });
  const locale = await getLocale();

  // Sonnet 1회 호출로 단체 대본 생성.
  let scriptText = "";
  try {
    const anthropic = getAnthropic();
    const res = await anthropic.messages.create({
      model: AI_MODELS.premium,
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: system + groupMemory + groupLocaleDirective(locale),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: apiMessages,
    });
    scriptText = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n");
  } catch {
    return jsonError(502, API_ERROR_CODES.PROVIDER_ERROR, "멤버들이 잠깐 자리를 비웠어요. 다시 시도해줘.");
  }

  let turns = parseGroupScript(scriptText);
  if (turns.length === 0) turns = [groupFallbackTurn()];

  await saveGroupTurns({
    sessionId: session.id,
    userId: profile.userId,
    turns,
    model: AI_MODELS.premium,
  });

  return NextResponse.json({
    turns: turns.map((t) => ({ speaker: t.speaker, name: t.name, content: t.text })),
  });
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}
