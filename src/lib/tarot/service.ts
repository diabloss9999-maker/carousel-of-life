/**
 * 타로 풀이 비즈니스 로직.
 *
 * - single 스프레드 (1장): 무료, 일일 한도
 * - three 스프레드 (3장 — 과거·현재·미래): 라이트 전용, 무제한
 */
import "server-only";

import { db } from "@/db";
import {
  tarotReadings,
  type Profile,
  type TarotReading,
} from "@/db/schema";
import { getLocale, getTranslations } from "next-intl/server";
import { generateJson } from "@/lib/ai/generate";
import {
  buildTarotSinglePrompt,
  buildTarotSevenPrompt,
  buildTarotThreePrompt,
} from "@/lib/ai/prompts";
import {
  tarotSingleAiSchema,
  tarotSevenAiSchema,
  tarotThreeAiSchema,
  type TarotSevenAiOutput,
  type TarotThreeAiOutput,
} from "@/lib/ai/types";
import {
  AI_LIMITS,
  AI_MODELS,
  FREE_DAILY_LIMITS,
} from "@/lib/constants";
import {
  getSubscriptionTier,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { drawCards, type DrawnCard } from "@/lib/tarot/draw";
import { buildTarotAnalysisBlock } from "@/lib/tarot/analysis";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { NEUTRAL_CARD_VOICE } from "@/lib/ai/character-voice";

export type TarotResult =
  | {
      ok: true;
      reading: TarotReading;
      cards: DrawnCard[];
      summary: string;
    }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "premium_only" }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * single 스프레드 (한 장) 타로 풀이.
 */
export async function createSingleTarot(opts: {
  profile: Profile;
  question: string | null;
  drawnCards?: DrawnCard[];
}): Promise<TarotResult> {
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "tarot",
    max: FREE_DAILY_LIMITS.fortune,
    amount: 2,
  });
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", max: quota.max };
  }

  const drawn = opts.drawnCards?.length === 1 ? opts.drawnCards : drawCards(1);
  const card = drawn[0];

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

  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: tarotSingleAiSchema,
      userPrompt: `${buildTarotSinglePrompt({
        profile,
        question: opts.question,
        card: {
          id: card.id,
          name: card.nameKo,
          isReversed: card.isReversed,
        },
        analysisBlock: buildTarotAnalysisBlock(drawn, profile, "single"),
      })}

[Neutral tarot reading rules]
- Do not mention any member, idol, fan-service concept, or Carousel Nine worldbuilding.
- Reflect the card name and upright/reversed state accurately, and connect the reading to the user's question when present.
- Do not write as a fixed prediction. Keep it practical and useful for today.
- Write 6 to 8 sentences in a calm Korean report tone.`,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.tarotMaxTokens,
      systemSuffix: NEUTRAL_CARD_VOICE,
      locale: await getLocale(),
    });
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("tarotAiFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
    };
  }

  const [row] = await db
    .insert(tarotReadings)
    .values({
      userId: profile.userId,
      spreadType: "single",
      question: opts.question,
      cards: drawn,
      interpretation: aiOutput.interpretation,
      model: AI_MODELS.premium,
    })
    .returning();

  return {
    ok: true,
    reading: row,
    cards: drawn,
    summary: aiOutput.summary,
  };
}

/**
 * three 스프레드 (3장: 과거-현재-미래) 타로 풀이.
 *
 * 라이트 전용. interpretation 컬럼에 JSON 직렬화로 4개 섹션 저장.
 */
export async function createThreeCardTarot(opts: {
  profile: Profile;
  question: string | null;
  drawnCards?: DrawnCard[];
}): Promise<TarotResult> {
  const subscribed = await hasActiveSubscription(opts.profile.userId);
  if (!subscribed) {
    return { ok: false, reason: "premium_only" };
  }

  const drawn = opts.drawnCards?.length === 3 ? opts.drawnCards : drawCards(3);

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

  let aiOutput: TarotThreeAiOutput;
  try {
    aiOutput = await generateJson({
      schema: tarotThreeAiSchema,
      userPrompt: `${buildTarotThreePrompt({
        profile,
        question: opts.question,
        cards: drawn.map((c) => ({
          id: c.id,
          name: c.nameKo,
          isReversed: c.isReversed,
        })),
        analysisBlock: buildTarotAnalysisBlock(drawn, profile, "three"),
      })}

[Neutral three-card tarot reading rules]
- Do not mention any member, idol, fan-service concept, or Carousel Nine worldbuilding.
- Keep the past, present, and future structure clear, and reflect each card name and upright/reversed state accurately.
- Do not write as a fixed prediction. Help the user organize the situation and choose a next action.
- Keep each of past, present, future, and synthesis to 2 or 3 concise sentences.
- Write summary, past, present, future, and synthesis in a calm Korean report tone.`,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.tarotMaxTokens,
      systemSuffix: NEUTRAL_CARD_VOICE,
      locale: await getLocale(),
    });
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("tarotAiFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
    };
  }

  // interpretation 컬럼에 JSON 으로 4개 섹션 저장.
  const interpretationJson = JSON.stringify({
    type: "three",
    past: aiOutput.past,
    present: aiOutput.present,
    future: aiOutput.future,
    synthesis: aiOutput.synthesis,
    summary: aiOutput.summary,
  });

  const [row] = await db
    .insert(tarotReadings)
    .values({
      userId: profile.userId,
      spreadType: "three",
      question: opts.question,
      cards: drawn,
      interpretation: interpretationJson,
      model: AI_MODELS.premium,
    })
    .returning();

  return {
    ok: true,
    reading: row,
    cards: drawn,
    summary: aiOutput.summary,
  };
}

/**
 * seven spread (7장 프로 전략 리포트).
 */
export async function createSevenCardTarot(opts: {
  profile: Profile;
  question: string | null;
  drawnCards?: DrawnCard[];
}): Promise<TarotResult> {
  const tier = await getSubscriptionTier(opts.profile.userId);
  if (tier !== "pro") {
    return { ok: false, reason: "premium_only" };
  }

  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "tarot",
    max: FREE_DAILY_LIMITS.fortune,
    amount: 4,
  });
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", max: quota.max };
  }

  const drawn = opts.drawnCards?.length === 7 ? opts.drawnCards : drawCards(7);

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

  let aiOutput: TarotSevenAiOutput;
  try {
    aiOutput = await generateJson({
      schema: tarotSevenAiSchema,
      userPrompt: `${buildTarotSevenPrompt({
        profile,
        question: opts.question,
        cards: drawn.map((c) => ({
          id: c.id,
          name: c.nameKo,
          isReversed: c.isReversed,
        })),
        analysisBlock: buildTarotAnalysisBlock(drawn, profile, "seven"),
      })}

[Neutral seven-card tarot reading rules]
- Do not mention any member, idol, fan-service concept, or Carousel Nine worldbuilding.
- This is a Pro-grade strategic tarot report. Make it deeper than the 3-card reading.
- Reflect all seven card names, positions, and upright/reversed states accurately.
- Keep the action plan concrete and useful within 7 days.
- Write in calm Korean report tone.`,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.tarotMaxTokens + 1400,
      systemSuffix: NEUTRAL_CARD_VOICE,
      locale: await getLocale(),
    });
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("tarotAiFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
    };
  }

  const interpretationJson = JSON.stringify({
    type: "seven",
    sections: aiOutput.sections,
    synthesis: aiOutput.synthesis,
    actionPlan: aiOutput.actionPlan,
    summary: aiOutput.summary,
  });

  const [row] = await db
    .insert(tarotReadings)
    .values({
      userId: profile.userId,
      spreadType: "seven",
      question: opts.question,
      cards: drawn,
      interpretation: interpretationJson,
      model: AI_MODELS.premium,
    })
    .returning();

  return {
    ok: true,
    reading: row,
    cards: drawn,
    summary: aiOutput.summary,
  };
}

/**
 * 사용자의 최근 타로 풀이 N 건.
 */
export async function getRecentTarotReadings(
  userId: string,
  limit = 10,
): Promise<TarotReading[]> {
  return db.query.tarotReadings.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit,
  });
}

/**
 * 오늘(KST 기준) 뽑은 타로 카드만 반환.
 */
export async function getTodayTarotReadings(
  userId: string,
): Promise<TarotReading[]> {
  // KST 오늘 날짜 문자열 (예: "2026-05-09")
  const todayKstStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  // KST 자정 = "2026-05-09T00:00:00+09:00" → UTC로 변환
  const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

  return db.query.tarotReadings.findMany({
    where: (t, { eq, gte, and }) =>
      and(eq(t.userId, userId), gte(t.createdAt, todayStartUtc)),
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
}

/**
 * three 스프레드 readings 의 interpretation 을 파싱한다.
 */
export interface ParsedThreeInterpretation {
  type: "three";
  past: string;
  present: string;
  future: string;
  synthesis: string;
  summary: string;
}

export interface ParsedSevenInterpretation {
  type: "seven";
  sections: Array<{ title: string; interpretation: string }>;
  synthesis: string;
  actionPlan: string;
  summary: string;
}

export function parseThreeInterpretation(
  raw: string,
): ParsedThreeInterpretation | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type !== "three") return null;
    return parsed as ParsedThreeInterpretation;
  } catch {
    return null;
  }
}

export function parseSevenInterpretation(
  raw: string,
): ParsedSevenInterpretation | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type !== "seven") return null;
    if (!Array.isArray(parsed.sections) || parsed.sections.length !== 7) return null;
    return parsed as ParsedSevenInterpretation;
  } catch {
    return null;
  }
}
