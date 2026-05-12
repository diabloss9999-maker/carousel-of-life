/**
 * 사주 심층 분석 (라이트 전용).
 *
 * - 한 번 생성되면 profile.sajuDeepReading 에 캐시되어 영구 보관
 * - 활성 구독자만 호출 가능 (호출자가 검증)
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { buildSajuDeepPrompt } from "@/lib/ai/prompts";
import { sajuDeepAiSchema, type SajuDeepAiOutput } from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

export interface SajuDeepReading extends SajuDeepAiOutput {
  model: string;
  createdAt: string; // ISO
}

/**
 * profile 의 sajuDeepReading 을 SajuDeepReading 으로 안전하게 좁혀준다.
 */
export function asSajuDeepReading(v: unknown): SajuDeepReading | null {
  if (!v || typeof v !== "object") return null;
  const parsed = sajuDeepAiSchema.safeParse(v);
  if (!parsed.success) return null;
  const meta = v as { model?: string; createdAt?: string };
  return {
    ...parsed.data,
    model: meta.model ?? "unknown",
    createdAt: meta.createdAt ?? new Date().toISOString(),
  };
}

export type DeepReadingResult =
  | { ok: true; reading: SajuDeepReading; cached: boolean }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * 심층 풀이를 생성하거나 캐시된 결과를 반환한다.
 *
 * @param profile  사용자 프로필 (사주가 없으면 자동 계산)
 * @param force    true 면 캐시 무시하고 재생성
 */
export async function getOrCreateDeepReading(
  profile: Profile,
  force = false,
): Promise<DeepReadingResult> {
  // 1) 캐시 우선.
  if (!force) {
    const cached = asSajuDeepReading(profile.sajuDeepReading);
    if (cached) return { ok: true, reading: cached, cached: true };
  }

  // 2) 사주 보장.
  let withSaju: Profile;
  try {
    withSaju = await ensureSajuCalculated(profile);
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "사주를 풀이할 별의 흐름을 읽지 못했어: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 3) AI 심층 풀이.
  let aiOutput: SajuDeepAiOutput;
  try {
    aiOutput = await generateJson({
      schema: sajuDeepAiSchema,
      userPrompt: buildSajuDeepPrompt(withSaju),
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.sajuDeepMaxTokens,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "심층 분석을 적지 못했어: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 4) profile 에 캐시.
  const reading: SajuDeepReading = {
    ...aiOutput,
    model: AI_MODELS.premium,
    createdAt: new Date().toISOString(),
  };

  await db
    .update(profiles)
    .set({ sajuDeepReading: reading })
    .where(eq(profiles.userId, withSaju.userId));

  return { ok: true, reading, cached: false };
}
