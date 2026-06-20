/**
 * 채팅 메시지 전송 + AI 스트리밍 응답.
 *
 * POST /api/chat/sessions/[sessionId]/messages
 *   body: { content: string }
 *   → text/plain stream
 *   첫 줄이 "CARDS:{json}\n" 이면 카드 메타데이터 (점술 요청 시)
 */
import { NextResponse, type NextRequest } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { checkRateLimit } from "@/lib/rate-limit/in-memory";
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
import { resolveReadingFlow, type ReadingResult } from "@/lib/chat/reading-detector";
import type { CharacterId } from "@/lib/chat/characters";
import { API_ERROR_CODES } from "@/types/api";
import { getCharacterSilenceHint } from "@/lib/systems/entity-mood";

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
  const tErr = await getTranslations("actionErrors");

  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return jsonError(400, API_ERROR_CODES.VALIDATION_FAILED, tErr("chatBodyParseFailed"));
  }
  if (!parsed.success) {
    return jsonError(
      400,
      API_ERROR_CODES.VALIDATION_FAILED,
      parsed.error.issues[0]?.message ?? tErr("chatBodyInvalid"),
    );
  }

  const { profile } = await requireProfile();

  // 분당 burst 제한 — 사용자당 20회/분. 일일 quota 와는 별개의 abuse 차단.
  const rl = checkRateLimit(`chat:${profile.userId}`, 20, 60_000);
  if (!rl.ok) {
    return new NextResponse(
      JSON.stringify({
        error: { code: API_ERROR_CODES.QUOTA_EXCEEDED, message: "너무 빠르게 보내고 있어. 잠시 후 다시 보내줘." },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSec ?? 60),
        },
      },
    );
  }

  const prepared = await prepareSendMessage({
    sessionId,
    userMessage: parsed.data.content,
    profile,
  });

  if (!prepared.ok) {
    if (prepared.reason === "quota_exceeded") {
      return jsonError(429, API_ERROR_CODES.QUOTA_EXCEEDED,
        tErr("chatQuotaExceeded", { n: prepared.max }));
    }
    if (prepared.reason === "session_not_found") {
      return jsonError(404, API_ERROR_CODES.NOT_FOUND, prepared.message);
    }
    return jsonError(500, API_ERROR_CODES.PROVIDER_ERROR, prepared.message);
  }

  // 친밀도 맥락 — 세션의 실제 character 사용 (시스템 프롬프트 내 다른 캐릭터 이름 언급 때문에 잘못 매칭되는 버그 방지)
  const characterId: CharacterId = prepared.characterId;

  const affinityRow = await getAffinity(profile.userId, characterId);
  const currentPoints = affinityRow?.points ?? 0;
  const locale = await getLocale();
  const affinityCtx = affinityContext(characterId, currentPoints);

  const messages = prepared.messages;

  // 점술 흐름 결정 — 의도 감지 시 즉시 카드를 그리고 해석에 주입.
  let reading: ReadingResult | null = null;
  let cardSystemInject = "";
  try {
    const decision = resolveReadingFlow(
      parsed.data.content,
      characterId,
    );
    if (decision.kind === "draw") {
      reading = decision.reading;
      cardSystemInject =
        `\n\n[카드 읽기 — 지금 즉시 실행 / 최우선 지시]\n` +
        `${reading.promptText}\n\n` +
        `절대 금지 (이 응답에서):\n` +
        `- "흩어진 카드가 다시 모이고 있어" / "바람이 다시 모인다" / "잠시…" 류의 setup 문구\n` +
        `- "가장 알고 싶은 게 뭐야?" / "무엇을 알고 싶지?" 류의 setup 질문\n` +
        `- 대괄호로 시작하는 시스템 라벨 ("[지금 막 …]" 등) 의 응답 노출\n` +
        `반드시: 응답 첫 문장에 카드 이름 + 정/역방향을 박고, 바로 그 카드의 의미를 캐릭터 목소리로 해석. 사용자 상황과 연결해 마무리 질문 1개.`;
    }
  } catch {
    /* 점술 흐름 판정 실패 시 무시하고 일반 대화로 진행 */
  }

  const silenceHint = getCharacterSilenceHint(characterId, locale);

  const enrichedSystem =
    prepared.systemPrompt +
    affinityCtx +
    cardSystemInject +
    silenceHint;

  const aiStream = streamChat({
    // 카드 점술 해석은 Sonnet, 일반 대화는 Haiku (비용 최적화)
    model: reading ? AI_MODELS.premium : AI_MODELS.chat,
    maxTokens: reading ? 1200 : AI_LIMITS.chatMaxTokens,
    system: enrichedSystem,
    locale,
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
          cards: reading?.cards,
        }),
        addAffinityPoint(prepared.profile.userId, characterId),
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
