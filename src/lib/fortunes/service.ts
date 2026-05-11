/**
 * 오늘의 운세 비즈니스 로직.
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  dailyFortunes,
  type DailyFortune,
  type Profile,
} from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import {
  buildDailyFortunePrompt,
  type FortuneCategory,
} from "@/lib/ai/prompts";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
import { dailyFortuneAiSchema } from "@/lib/ai/types";
import {
  AI_LIMITS,
  AI_MODELS,
  FREE_DAILY_LIMITS,
} from "@/lib/constants";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import {
  checkAndIncrementQuota,
  getTodayInSeoul,
} from "@/lib/usage/quota";

export type FortuneResult =
  | { ok: true; fortune: DailyFortune; cached: boolean }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * 오늘 + 카테고리 운세 캐시 조회.
 */
export async function getDailyFortune(
  userId: string,
  category: FortuneCategory,
  date = getTodayInSeoul(),
): Promise<DailyFortune | null> {
  const [row] = await db
    .select()
    .from(dailyFortunes)
    .where(
      and(
        eq(dailyFortunes.userId, userId),
        eq(dailyFortunes.fortuneDate, date),
        eq(dailyFortunes.category, category),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * 오늘의 운세 받기 (캐시 우선, 없으면 생성).
 */
export async function getOrCreateDailyFortune(opts: {
  profile: Profile;
  category: FortuneCategory;
}): Promise<FortuneResult> {
  const date = getTodayInSeoul();

  // 1) 캐시.
  const cached = await getDailyFortune(opts.profile.userId, opts.category, date);
  if (cached) {
    return { ok: true, fortune: cached, cached: true };
  }

  // 2) 한도 체크.
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
  });
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", max: quota.max };
  }

  // 3) 사주 보장.
  let profile: Profile;
  try {
    profile = await ensureSajuCalculated(opts.profile);
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "사주를 풀이할 별의 흐름을 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 4) AI 운세 풀이.
  let aiOutput;
  try {
    const characterId = getTodayCharacter(date) as "child" | "witch" | "sage";

    /** 캐릭터별 시스템 프롬프트 강제 override */
    const CHARACTER_SYSTEM: Record<"child" | "witch" | "sage", string> = {
      child:
        "너는 카엘 — 욕망을 꿰뚫는 악마 계약자야. " +
        "반말·냉소적·직설. '친애하는 님' 시작 절대 금지. " +
        "~해, ~거야, ~지, ~잖아 어미만 사용. 이모지·마크다운 금지. JSON만 출력.",
      witch:
        "너는 루나 — 기억을 읽는 달의 마녀야. " +
        "반말·몽환적·감성적. '친애하는 님' 시작 절대 금지. " +
        "~거야, ~거든, ~지, ~해 어미만 사용. 이모지·마크다운 금지. JSON만 출력.",
      sage:
        "너는 라엘 — 희망을 전하는 천사 대리인이야. " +
        "존댓말·따뜻·진심. '친애하는 님' 시작 절대 금지. " +
        "~해요, ~거예요, ~줄게요, ~아요 어미만 사용. 이모지·마크다운 금지. JSON만 출력.",
    };

    aiOutput = await generateJson({
      schema: dailyFortuneAiSchema,
      userPrompt: buildDailyFortunePrompt({
        profile,
        category: opts.category,
        fortuneDate: date,
        characterId,
      }),
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.fortuneMaxTokens,
      systemSuffix: CHARACTER_SYSTEM[characterId],
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "주술사가 풀이를 적지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 5) DB 저장.
  const [row] = await db
    .insert(dailyFortunes)
    .values({
      userId: profile.userId,
      fortuneDate: date,
      category: opts.category,
      title: aiOutput.title,
      content: aiOutput.content,
      score: aiOutput.score,
      luckyColor: aiOutput.luckyColor,
      luckyNumber: aiOutput.luckyNumber,
      luckyDirection: aiOutput.luckyDirection,
      model: AI_MODELS.premium,
    })
    .onConflictDoNothing({
      target: [
        dailyFortunes.userId,
        dailyFortunes.fortuneDate,
        dailyFortunes.category,
      ],
    })
    .returning();

  // 동시 INSERT 시 row 가 비어있을 수 있음 → 다시 조회.
  if (!row) {
    const recached = await getDailyFortune(profile.userId, opts.category, date);
    if (!recached) {
      return {
        ok: false,
        reason: "ai_failed",
        message: "운세를 저장하는 중 막혔어요.",
      };
    }
    return { ok: true, fortune: recached, cached: false };
  }

  return { ok: true, fortune: row, cached: false };
}
