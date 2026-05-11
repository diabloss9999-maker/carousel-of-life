/**
 * 채팅 메시지 전송 + AI 스트리밍 응답.
 *
 * POST /api/chat/sessions/[sessionId]/messages
 *   body: { content: string }
 *   → text/plain stream
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
      return jsonError(
        429,
        API_ERROR_CODES.QUOTA_EXCEEDED,
        `오늘의 문답 한도(${prepared.max}회)를 모두 사용했어요.`,
      );
    }
    if (prepared.reason === "session_not_found") {
      return jsonError(404, API_ERROR_CODES.NOT_FOUND, prepared.message);
    }
    return jsonError(
      500,
      API_ERROR_CODES.PROVIDER_ERROR,
      prepared.message,
    );
  }

  // 친밀도 포인트 가산 + 프롬프트 맥락 주입
  const characterId = (prepared.systemPrompt.includes("카엘")
    ? "child"
    : prepared.systemPrompt.includes("루나")
      ? "witch"
      : "sage") as CharacterId;

  const [affinityRow] = await Promise.all([
    getAffinity(profile.userId, characterId),
  ]);
  const currentPoints = affinityRow?.points ?? 0;
  const affinityCtx = affinityContext(characterId, currentPoints);

  // 시스템 프롬프트 뒤에 친밀도 맥락 추가
  const enrichedSystem = prepared.systemPrompt + affinityCtx;

  const stream = streamChat({
    model: AI_MODELS.chat,
    maxTokens: AI_LIMITS.chatMaxTokens,
    system: enrichedSystem,
    messages: prepared.messages,
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
        // AI 응답 완료 시 친밀도 +1
        addAffinityPoint(prepared.profile.userId, characterId),
      ]);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Accel-Buffering": "no", // nginx 등 프록시 버퍼링 방지
    },
  });
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status },
  );
}
