/**
 * 채팅 메시지 전송 + AI 스트리밍 응답.
 *
 * POST /api/chat/sessions/[sessionId]/messages
 *   body: { content: string }
 *   → text/plain stream
 *   첫 줄이 "CARDS:{json}\n" 이면 카드 메타데이터 (점술 요청 시)
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { streamChat } from "@/lib/ai/stream";
import {
  prepareSendMessage,
  saveAssistantMessage,
} from "@/lib/chat/service";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import {
  addAffinityPoint,
  affinityContext,
  getAffinity,
} from "@/lib/affinity/service";
import { detectAndDraw } from "@/lib/chat/reading-detector";
import { addCrack, reduceCrack, getCrackScore, CRACK_CONTEXT } from "@/lib/crack/service";
import type { CharacterId } from "@/lib/chat/characters";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  content: z
    .string()
    .min(1, "질문을 입력해줘.")
    .max(100, "질문은 100자 이내로 짧게 부탁해."),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;

  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return jsonError(400, API_ERROR_CODES.VALIDATION_FAILED, "요청 본문 파싱 실패");
  }
  if (!parsed.success) {
    return jsonError(
      400,
      API_ERROR_CODES.VALIDATION_FAILED,
      parsed.error.issues[0]?.message ?? "본문이 올바르지 않아요.",
    );
  }

  const { profile } = await requireProfile();

  const prepared = await prepareSendMessage({
    sessionId,
    userMessage: parsed.data.content,
    profile,
  });

  if (!prepared.ok) {
    if (prepared.reason === "quota_exceeded") {
      return jsonError(429, API_ERROR_CODES.QUOTA_EXCEEDED,
        `오늘의 문답 한도(${prepared.max}회)를 모두 사용했어요.`);
    }
    if (prepared.reason === "session_not_found") {
      return jsonError(404, API_ERROR_CODES.NOT_FOUND, prepared.message);
    }
    return jsonError(500, API_ERROR_CODES.PROVIDER_ERROR, prepared.message);
  }

  // 친밀도 맥락
  const characterId = (
    prepared.systemPrompt.includes("카엘")    ? "child"    :
    prepared.systemPrompt.includes("루나")    ? "witch"    :
    prepared.systemPrompt.includes("라엘")    ? "sage"     :
    prepared.systemPrompt.includes("소령")    ? "shaman"   :
    prepared.systemPrompt.includes("현도")    ? "taoist"   :
    prepared.systemPrompt.includes("귀염")    ? "dokkaebi" :
    "witch"
  ) as CharacterId;

  const [affinityRow, crackData] = await Promise.all([
    getAffinity(profile.userId, characterId),
    getCrackScore(profile.userId),
  ]);
  const currentPoints = affinityRow?.points ?? 0;
  const affinityCtx = affinityContext(characterId, currentPoints);
  const crackCtx = CRACK_CONTEXT[crackData.level];

  // 점술 요청 감지 + 카드 추첨 (이세계만 카드, 동양은 null)
  let reading = null;
  try {
    reading = detectAndDraw(parsed.data.content, characterId);
  } catch { /* 카드 추첨 실패 시 무시하고 일반 대화로 진행 */ }

  const messages = prepared.messages;

  // 카드가 뽑혔으면 시스템 프롬프트에 주입 (유저 메시지보다 강하게 적용)
  const cardSystemInject = reading
    ? `\n\n[카드 읽기 — 지금 즉시 실행]\n${reading.promptText}`
    : "";

  const enrichedSystem = prepared.systemPrompt + affinityCtx + crackCtx + cardSystemInject;

  const aiStream = streamChat({
    model: AI_MODELS.chat,
    maxTokens: reading ? 1200 : AI_LIMITS.chatMaxTokens,
    system: enrichedSystem,
    messages,
    onComplete: async ({ fullText, inputTokens, outputTokens }) => {
      if (fullText.trim().length === 0) return;
      await Promise.all([
        saveAssistantMessage({
          sessionId,
          userId: prepared.profile.userId,
          content: fullText,
          inputTokens,
          outputTokens,
          model: AI_MODELS.chat,
        }),
        addAffinityPoint(prepared.profile.userId, characterId),
        // 귀염 대화 → 균열 +1 / 라엘 대화 → 균열 -1
        characterId === "dokkaebi"
          ? addCrack(prepared.profile.userId, 1, "chat:dokkaebi")
          : characterId === "sage"
            ? reduceCrack(prepared.profile.userId, 1)
            : Promise.resolve(undefined),
      ]);
    },
  });

  // 카드가 있으면 스트림 앞에 CARDS: 이벤트 삽입
  const finalStream = reading
    ? prependCardEvent(reading.cards, aiStream)
    : aiStream;

  return new Response(finalStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}

/** AI 스트림 앞에 "CARDS:{json}\n" 이벤트를 붙인다. */
function prependCardEvent(
  cards: { id: string; nameKo: string; nameEn?: string; imageSrc: string; isReversed?: boolean; position?: string }[],
  aiStream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const cardLine = `CARDS:${JSON.stringify(cards)}\n`;

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(cardLine));
      const reader = aiStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status },
  );
}
