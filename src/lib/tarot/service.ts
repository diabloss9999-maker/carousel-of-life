/**
 * 타로 풀이 비즈니스 로직.
 *
 * - 사용자가 카드 뽑기를 요청하면: 한도 체크 → 카드 뽑기 → AI 풀이 → DB 저장
 * - MVP: single 스프레드만 지원 (1장)
 */
import "server-only";

import { z } from "zod";

import { db } from "@/db";
import {
  tarotReadings,
  type Profile,
  type TarotReading,
} from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { buildTarotSinglePrompt } from "@/lib/ai/prompts";
import {
  AI_LIMITS,
  AI_MODELS,
  FREE_DAILY_LIMITS,
} from "@/lib/constants";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { drawCards, type DrawnCard } from "@/lib/tarot/draw";
import {
  checkAndIncrementQuota,
} from "@/lib/usage/quota";

const tarotSingleAiSchema = z.object({
  interpretation: z.string().min(1).max(2000),
  summary: z.string().min(1).max(80),
});

export type TarotResult =
  | {
      ok: true;
      reading: TarotReading;
      cards: DrawnCard[];
      summary: string;
    }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * single 스프레드 (한 장) 타로 풀이를 생성한다.
 */
export async function createSingleTarot(opts: {
  profile: Profile;
  question: string | null;
}): Promise<TarotResult> {
  // 1) 한도 체크.
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "tarot",
    max: FREE_DAILY_LIMITS.tarot,
  });
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", max: quota.max };
  }

  // 2) 카드 뽑기 (1장).
  const drawn = drawCards(1);
  const card = drawn[0];

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

  // 4) AI 풀이.
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

  // 5) DB 저장.
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
 * 사용자의 최근 타로 풀이 N 건을 조회한다.
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
