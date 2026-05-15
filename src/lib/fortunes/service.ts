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
import { getLocale, getTranslations } from "next-intl/server";
import { generateJson } from "@/lib/ai/generate";
import {
  buildDailyFortunePrompt,
  type FortuneCategory,
} from "@/lib/ai/prompts";
import {
  getTodayCharacter,
  getTodayCharacterByCategory,
} from "@/lib/daily-question/rotation";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
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
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("fortuneSajuFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
    };
  }

  // 4) AI 운세 풀이.
  let aiOutput;
  try {
    /**
     * 카테고리별 해설 주술사 분기.
     * - 별자리 (zodiac)        → 북유럽 (외르문드·비요른·헬가)
     * - 십이간지 (chinese_zodiac) → 동양 (소령·현도·흑랑)
     * - 그 외 카테고리         → 9명 전체 풀에서 일일 순환
     */
    const characterId =
      opts.category === "zodiac"
        ? getTodayCharacterByCategory("북유럽", date)
        : opts.category === "chinese_zodiac"
          ? getTodayCharacterByCategory("동양", date)
          : getTodayCharacter(date);

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
      systemSuffix: CHARACTER_CARD_VOICE[characterId],
      locale: await getLocale(),
    });
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("fortuneAiFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
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
