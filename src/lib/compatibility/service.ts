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
import { getLocale, getTranslations } from "next-intl/server";
import { generateJson } from "@/lib/ai/generate";
import { NEUTRAL_CARD_VOICE } from "@/lib/ai/character-voice";
import {
  buildCompatibilityPrompt,
  type PartnerInfo,
} from "@/lib/ai/prompts";
import {
  compatibilityAiSchema,
  compatibilityProAiSchema,
  type CompatibilityProAiOutput,
} from "@/lib/ai/types";
import type { CompatibilityDetailPayload } from "@/lib/compatibility/detail";
import { AI_LIMITS, AI_MODELS, FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  getSubscriptionTier,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { analyzeSajuMatch } from "@/lib/saju/compatibility-match";
import { checkAndIncrementQuota } from "@/lib/usage/quota";

const FREE_DAILY_COMPATIBILITY = 0;

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
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
    amount: 2,
  });
  if (!quota.ok) {
    return {
      ok: false,
      reason: "quota_exceeded",
      max: quota.max,
    };
  }

  // 1) 한도 (구독자는 무제한).
  let subscribed = false;
  try {
    subscribed = await hasActiveSubscription(opts.profile.userId);
  } catch {
    // 구독 상태 확인 실패 시 비구독자로 간주
    subscribed = false;
  }

  if (false && !subscribed) {
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
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("fortuneSajuFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
    };
  }

  // 3) 결정론적 궁합 분석 — 두 사주의 십성관계·일지 합충·오행보완·용신교환.
  const match = analyzeSajuMatch(
    {
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      calendarSystem: profile.calendarSystem,
    },
    {
      birthDate: opts.partner.birthDate,
      birthTime: opts.partner.birthTime,
      calendarSystem: opts.partner.calendarSystem,
    },
  );

  // 4) AI 풀이.
  let aiOutput;
  let proOutput: CompatibilityProAiOutput | null = null;
  try {
    aiOutput = await generateJson({
      schema: compatibilityAiSchema,
      userPrompt: buildCompatibilityPrompt({
        profile,
        partner: opts.partner,
        matchBlock: match?.block,
      }),
      model: AI_MODELS.fast,
      maxTokens: 900,
      systemSuffix: NEUTRAL_CARD_VOICE,
      locale: await getLocale(),
    });
    const tier = await getSubscriptionTier(profile.userId);
    if (tier === "pro") {
      proOutput = await generateJson({
        schema: compatibilityProAiSchema,
        userPrompt: buildCompatibilityProPrompt({
          profile,
          partner: opts.partner,
          score: match?.score ?? aiOutput.score,
          basicSummary: aiOutput.summary,
          basicDetail: aiOutput.detail,
          matchBlock: match?.block,
        }),
        model: AI_MODELS.premium,
        maxTokens: AI_LIMITS.compatibilityMaxTokens + 1800,
        systemSuffix: NEUTRAL_CARD_VOICE,
        locale: await getLocale(),
      });
    }
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "ai_failed",
      message: tErr("compatibilityAiFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
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
        // 점수는 결정론적 계산값을 우선(AI 가 임의로 바꿔도 무시). 계산 불가 시 AI 값.
        score: match?.score ?? aiOutput.score,
        summary: aiOutput.summary,
        detail: JSON.stringify({
          type: "compatibility_detail_v2",
          basic: aiOutput.detail,
          ...(proOutput ? { pro: proOutput } : {}),
        } satisfies CompatibilityDetailPayload),
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

function buildCompatibilityProPrompt(opts: {
  profile: Profile;
  partner: PartnerInfo;
  score: number;
  basicSummary: string;
  basicDetail: string;
  matchBlock?: string;
}): string {
  return `[내 정보]
이름: ${opts.profile.displayName ?? "사용자"}
생년월일: ${opts.profile.birthDate}
태어난 시간: ${opts.profile.birthTime ?? "모름"}
성별: ${opts.profile.gender}
MBTI: ${opts.profile.mbti ?? "모름"}

[상대 정보]
이름: ${opts.partner.name}
생년월일: ${opts.partner.birthDate}
태어난 시간: ${opts.partner.birthTime ?? "모름"}
성별: ${opts.partner.gender}
MBTI: ${opts.partner.mbti ?? "모름"}

[기본 궁합]
점수: ${opts.score}/100
요약: ${opts.basicSummary}
기본 해석: ${opts.basicDetail}
${opts.matchBlock ? `\n[사주 궁합 계산 근거]\n${opts.matchBlock}\n` : ""}

[작성 지시]
프로 전용 궁합 심층 리포트를 작성해.
단순 점수 반복이 아니라, 관계가 실제로 굴러가는 방식과 대화/갈등/타이밍/30일 전략을 구체적으로 정리해.
아이돌, 멤버, 팬서비스, 세계관 언급 금지.
운명 단정 금지. 관계는 선택과 태도에 따라 달라질 수 있다는 톤을 유지해.
현대적이고 차분한 한국어 리포트 톤으로 작성해.
마크다운 기호와 이모지는 쓰지 마.

반드시 아래 JSON으로만 응답:
{
  "relationshipPattern": "두 사람이 가까워지는 방식과 반복될 수 있는 관계 패턴 5~7문장",
  "attractionPoint": "서로에게 끌리는 지점과 오래 가는 매력 4~6문장",
  "conflictPattern": "부딪히기 쉬운 지점과 그 이유 5~7문장",
  "conversationGuide": "상대에게 말을 꺼내는 방식, 피해야 할 말투, 좋은 문장 예시를 포함한 대화 가이드 5~7문장",
  "timingAdvice": "지금 관계에서 속도를 내도 되는 부분과 기다려야 하는 부분 4~6문장",
  "thirtyDayPlan": "앞으로 30일 동안 실천할 관계 전략 6~8문장",
  "summary": "프로 심층 한 줄 요약 40자 이내"
}`;
}
