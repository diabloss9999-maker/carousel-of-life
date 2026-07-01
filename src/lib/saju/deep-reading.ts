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
import { getLocale, getTranslations } from "next-intl/server";
import { generateJson } from "@/lib/ai/generate";
import { buildSajuDeepPrompt } from "@/lib/ai/prompts";
import { sajuDeepAiSchema, type SajuDeepAiOutput } from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { annotateHanjaDeep } from "@/lib/saju/hanja-annotate";
import { buildDaeunTimelineBlock } from "@/lib/saju/luck-cycles";
import {
  analyzeNatal,
  buildNatalAnalysisBlock,
  type NatalPillars,
} from "@/lib/saju/ten-gods";
import {
  NEUTRAL_SAJU_VOICE,
  NEUTRAL_SAJU_VOICE_ID,
} from "@/lib/ai/character-voice";

/** profile.sajuPillars(jsonb) → NatalPillars(분석 입력). */
function toNatalPillars(raw: unknown): NatalPillars | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, { stem?: string; branch?: string } | null>;
  const norm = (
    x: { stem?: string; branch?: string } | null | undefined,
  ): { stem: string; branch: string } | null =>
    x?.stem && x?.branch ? { stem: x.stem, branch: x.branch } : null;
  return {
    year: norm(p.year),
    month: norm(p.month),
    day: norm(p.day),
    hour: norm(p.hour),
  };
}

/**
 * 심층 풀이 프롬프트에 주입할 결정론적 명리 분석 블록을 만든다.
 * 강약/용신/십성/원국관계/신살·십이운성 + 대운 타임라인. 없으면 빈 문자열.
 */
function buildDeepAnalysisBlock(profile: Profile): string {
  const parts: string[] = [];
  const natalPillars = toNatalPillars(profile.sajuPillars);
  if (natalPillars) {
    const natal = analyzeNatal(natalPillars);
    if (natal) parts.push(buildNatalAnalysisBlock(natal));
  }
  const daeun = buildDaeunTimelineBlock(profile);
  if (daeun) parts.push(daeun);
  return parts.join("\n\n");
}

export interface SajuDeepReading extends SajuDeepAiOutput {
  model: string;
  createdAt: string; // ISO
  voice?: string;
}

/**
 * profile 의 sajuDeepReading 을 SajuDeepReading 으로 안전하게 좁혀준다.
 */
export function asSajuDeepReading(v: unknown): SajuDeepReading | null {
  if (!v || typeof v !== "object") return null;
  const meta = v as { model?: string; createdAt?: string; voice?: string };
  if (meta.voice !== NEUTRAL_SAJU_VOICE_ID) return null;
  const parsed = sajuDeepAiSchema.safeParse(v);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    model: meta.model ?? "unknown",
    createdAt: meta.createdAt ?? new Date().toISOString(),
    voice: meta.voice,
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
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("deepReadingSajuFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
    };
  }

  // 3) AI 심층 풀이.
  let aiOutput: SajuDeepAiOutput;
  try {
    aiOutput = await generateJson({
      schema: sajuDeepAiSchema,
      userPrompt: buildSajuDeepPrompt(withSaju, buildDeepAnalysisBlock(withSaju)),
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.sajuDeepMaxTokens,
      systemSuffix: NEUTRAL_SAJU_VOICE,
      locale: await getLocale(),
    });
  } catch (e) {
    console.error("[saju] deep reading AI failed", e);
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("deepReadingAiFailed"),
    };
  }

  // 4) 한자 옆에 한글 음 자동 병기 — AI 가 프롬프트 지시 어겨도 보안망.
  const annotated = annotateHanjaDeep(aiOutput);

  // 5) profile 에 캐시.
  const reading: SajuDeepReading = {
    ...annotated,
    model: AI_MODELS.premium,
    createdAt: new Date().toISOString(),
    voice: NEUTRAL_SAJU_VOICE_ID,
  };

  await db
    .update(profiles)
    .set({ sajuDeepReading: reading })
    .where(eq(profiles.userId, withSaju.userId));

  return { ok: true, reading, cached: false };
}
