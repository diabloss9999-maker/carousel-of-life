/**
 * 궁합 풀이 비즈니스 로직.
 *
 * 정책: 비구독자는 일 1회 무료. 구독자는 무제한.
 * (별도 SQL quota 함수 대신 compatibility_readings 테이블에서 직접 카운트)
 */
import "server-only";

import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  compatibilityReadings,
  type CompatibilityReading,
  type Profile,
} from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
import {
  buildCompatibilityPrompt,
  type PartnerInfo,
} from "@/lib/ai/prompts";
import { compatibilityAiSchema } from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { ensureSajuCalculated } from "@/lib/saju/calculate";

const FREE_DAILY_COMPATIBILITY = 3;

export type CompatibilityResult =
  | { ok: true; reading: CompatibilityReading }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * 사용자의 최근 궁합 풀이 N 건.
 */
export async function getRecentCompatibility(
  userId: string,
  limit = 5,
): Promise<CompatibilityReading[]> {
  return db
    .select()
    .from(compatibilityReadings)
    .where(eq(compatibilityReadings.userId, userId))
    .orderBy(desc(compatibilityReadings.createdAt))
    .limit(limit);
}

/**
 * 오늘(KST 기준) 생성된 궁합 풀이 목록.
 */
export async function getTodayCompatibility(
  userId: string,
): Promise<CompatibilityReading[]> {
  const todayKst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  todayKst.setHours(0, 0, 0, 0);
  const todayStartUtc = new Date(
    todayKst.getTime() - todayKst.getTimezoneOffset() * 60000,
  );

  return db
    .select()
    .from(compatibilityReadings)
    .where(
      and(
        eq(compatibilityReadings.userId, userId),
        gte(compatibilityReadings.createdAt, todayStartUtc),
      ),
    )
    .orderBy(desc(compatibilityReadings.createdAt))
    .limit(20);
}

/**
 * 특정 상대(이름·생년월일 일치)와의 오늘자 가장 최근 풀이를 반환.
 * 없으면 null.
 */
export async function getTodayCompatibilityForPartner(opts: {
  userId: string;
  partnerName: string;
  partnerBirthDate: string;
}): Promise<CompatibilityReading | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(compatibilityReadings)
    .where(
      and(
        eq(compatibilityReadings.userId, opts.userId),
        eq(compatibilityReadings.partnerName, opts.partnerName),
        eq(compatibilityReadings.partnerBirthDate, opts.partnerBirthDate),
        gte(compatibilityReadings.createdAt, today),
      ),
    )
    .orderBy(desc(compatibilityReadings.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * 새 궁합 풀이 생성.
 */
export async function createCompatibility(opts: {
  profile: Profile;
  partner: PartnerInfo;
}): Promise<CompatibilityResult> {
  // 1) 한도 (구독자는 무제한).
  let subscribed = false;
  try {
    subscribed = await hasActiveSubscription(opts.profile.userId);
  } catch {
    // 구독 상태 확인 실패 시 비구독자로 간주
    subscribed = false;
  }

  if (!subscribed) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    try {
      const [row] = await db
        .select({ value: count() })
        .from(compatibilityReadings)
        .where(
          and(
            eq(compatibilityReadings.userId, opts.profile.userId),
            gte(compatibilityReadings.createdAt, today),
          ),
        );
      todayCount = Number(row?.value ?? 0);
    } catch {
      // 카운트 조회 실패 시 한도 초과로 간주하지 않고 진행
      todayCount = 0;
    }

    if (todayCount >= FREE_DAILY_COMPATIBILITY) {
      return {
        ok: false,
        reason: "quota_exceeded",
        max: FREE_DAILY_COMPATIBILITY,
      };
    }
  }

  // 2) 사주 보장.
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

  // 3) AI 풀이.
  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: compatibilityAiSchema,
      userPrompt: buildCompatibilityPrompt({
        profile,
        partner: opts.partner,
      }),
      model: AI_MODELS.fast,
      maxTokens: 900,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "두 사람의 기운을 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 4) DB 저장.
  let row;
  try {
    const [inserted] = await db
      .insert(compatibilityReadings)
      .values({
        userId: profile.userId,
        partnerName: opts.partner.name,
        partnerBirthDate: opts.partner.birthDate,
        partnerBirthTime: opts.partner.birthTime,
        partnerCalendarSystem: opts.partner.calendarSystem,
        partnerGender: opts.partner.gender,
        partnerMbti: opts.partner.mbti,
        score: aiOutput.score,
        summary: aiOutput.summary,
        detail: aiOutput.detail,
        model: AI_MODELS.premium,
      })
      .returning();
    row = inserted;
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message: "결과를 저장하지 못했어요: " + (e instanceof Error ? e.message : String(e)),
    };
  }

  return { ok: true, reading: row };
}
