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
  dailyFortuneScoreFor,
  type FortuneCategory,
} from "@/lib/ai/prompts";
import { dailyFortuneAiSchema } from "@/lib/ai/types";
import {
  AI_LIMITS,
  AI_MODELS,
  FREE_DAILY_LIMITS,
} from "@/lib/constants";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { getDailyManse } from "@/lib/saju/daily-manse";
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
  profile?: Profile,
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

  if (!row) return null;

  if (!profile) return row;

  // 캐시된 운세도 점수는 오늘의 명리 흐름으로 재계산 — 생성 시 점수와 일치.
  const manse = getDailyManse(profile, date, category);

  return {
    ...row,
    score: dailyFortuneScoreFor(
      {
        profile,
        category,
        fortuneDate: date,
      },
      manse?.delta ?? 0,
    ),
  };
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
  const cached = await getDailyFortune(
    opts.profile.userId,
    opts.category,
    date,
    opts.profile,
  );
  if (cached) {
    return { ok: true, fortune: cached, cached: true };
  }

  // 2) 한도 체크.
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
    amount:
      opts.category === "zodiac" || opts.category === "chinese_zodiac"
        ? 2
        : 1,
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

  // 4) 오늘의 명리 흐름 (일진×사주 충·합·오행·십성) — 정확도 핵심.
  const manse = getDailyManse(profile, date, opts.category);

  // 5) AI 운세 풀이.
  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: dailyFortuneAiSchema,
      userPrompt: `${buildDailyFortunePrompt({
        profile,
        category: opts.category,
        fortuneDate: date,
        manse,
      })}

[Neutral daily fortune rules]
- Do not mention any member, idol, fan-service concept, or Carousel Nine worldbuilding.
- Write as an independent Korean fortune report in polite language.
- Keep the title concise, not like a character quote. Max 20 Korean characters if possible.
- The content should be 5 to 7 practical sentences focused on today's mood, caution, and useful action.
- Avoid fixed predictions, excessive mysticism, banmal, emoji, markdown, and stage/performance metaphors.
- luckyColor, luckyNumber, and luckyDirection must be simple values users can understand immediately.`,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.fortuneMaxTokens,
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

  // 6) DB 저장.
  const [row] = await db
    .insert(dailyFortunes)
    .values({
      userId: profile.userId,
      fortuneDate: date,
      category: opts.category,
      title: aiOutput.title,
      content: aiOutput.content,
      score: dailyFortuneScoreFor(
        {
          profile,
          category: opts.category,
          fortuneDate: date,
        },
        manse?.delta ?? 0,
      ),
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
    const recached = await getDailyFortune(
      profile.userId,
      opts.category,
      date,
      profile,
    );
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
