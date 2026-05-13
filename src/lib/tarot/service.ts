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
import { generateJson } from "@/lib/ai/generate";
import {
  buildTarotSinglePrompt,
  buildTarotThreePrompt,
} from "@/lib/ai/prompts";
import {
  tarotSingleAiSchema,
  tarotThreeAiSchema,
  type TarotThreeAiOutput,
} from "@/lib/ai/types";
import {
  AI_LIMITS,
  AI_MODELS,
  FREE_DAILY_LIMITS,
} from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { drawCards, type DrawnCard } from "@/lib/tarot/draw";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { getTodayCharacterByCategory } from "@/lib/daily-question/rotation";

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
}): Promise<TarotResult> {
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "tarot",
    max: FREE_DAILY_LIMITS.tarot,
  });
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", max: quota.max };
  }

  const drawn = drawCards(1);
  const card = drawn[0];

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

  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: tarotSingleAiSchema,
      userPrompt: buildTarotSinglePrompt({
        profile,
        question: opts.question,
        card: {
          id: card.id,
          name: card.nameKo,
          isReversed: card.isReversed,
        },
      }),
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.tarotMaxTokens,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacterByCategory("이세계")],
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "타로의 계시를 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
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
}): Promise<TarotResult> {
  const subscribed = await hasActiveSubscription(opts.profile.userId);
  if (!subscribed) {
    return { ok: false, reason: "premium_only" };
  }

  const drawn = drawCards(3);

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

  let aiOutput: TarotThreeAiOutput;
  try {
    aiOutput = await generateJson({
      schema: tarotThreeAiSchema,
      userPrompt: buildTarotThreePrompt({
        profile,
        question: opts.question,
        cards: drawn.map((c) => ({
          id: c.id,
          name: c.nameKo,
          isReversed: c.isReversed,
        })),
      }),
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.tarotMaxTokens * 2,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacterByCategory("이세계")],
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "세 장의 흐름을 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
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
