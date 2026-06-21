/**
 * 채팅 메시지 전송 + AI 스트리밍 응답.
 *
 * POST /api/chat/sessions/[sessionId]/messages
 *   body: { content: string }
 *   → text/plain stream
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

  const silenceHint = getCharacterSilenceHint(characterId, locale);

  const enrichedSystem =
    prepared.systemPrompt +
    affinityCtx +
    silenceHint;

  const aiStream = streamChat({
    model: AI_MODELS.chat,
    maxTokens: AI_LIMITS.chatMaxTokens,
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
        }),
        addAffinityPoint(prepared.profile.userId, characterId),
      ]);
    },
  });

  return new Response(aiStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status },
  );
}
