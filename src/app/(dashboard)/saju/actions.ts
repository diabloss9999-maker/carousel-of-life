"use server";

/**
 * 사주 페이지 — 사주 캐시 + 심층 분석 액션.
 */
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { dailyIljin, profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { enforceAiRateLimit, RateLimitedError } from "@/lib/rate-limit/in-memory";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
import { calculateSaju } from "@/lib/saju/calculate";
import { getOrCreateDeepReading } from "@/lib/saju/deep-reading";
import { annotateHanjaDeep } from "@/lib/saju/hanja-annotate";
import { getDayPillar } from "@/lib/saju/iljin";
import {
  analyzeDayRelationship,
  type RelationshipResult,
} from "@/lib/saju/relationships";
import { iljinAiSchema, type IljinAiOutput } from "@/lib/ai/types";
import { generateJson } from "@/lib/ai/generate";
import { AI_MODELS } from "@/lib/constants";

export interface CalculateSajuState {
  kind: "idle" | "error";
  message?: string;
}

export async function calculateSajuAction(): Promise<CalculateSajuState> {
  try {
    const { profile } = await requireProfile();
    const saju = await calculateSaju(profile);
    await db
      .update(profiles)
      .set({ sajuPillars: saju.pillars, fiveElements: saju.fiveElements })
      .where(eq(profiles.userId, profile.userId));
    revalidatePath("/saju");
    return { kind: "idle" };
  } catch (e) {
    return {
      kind: "error",
      message:
        "사주를 계산하지 못했어: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }
}

/**
 * 사주 캐시를 초기화하고 재계산한다.
 */
export async function resetSajuAction(): Promise<CalculateSajuState> {
  try {
    const { profile } = await requireProfile();
    // 기존 캐시 초기화
    await db
      .update(profiles)
      .set({ sajuPillars: null, fiveElements: null, sajuDeepReading: null })
      .where(eq(profiles.userId, profile.userId));
    // 재계산
    const saju = await calculateSaju(profile);
    await db
      .update(profiles)
      .set({ sajuPillars: saju.pillars, fiveElements: saju.fiveElements })
      .where(eq(profiles.userId, profile.userId));
    revalidatePath("/saju");
    return { kind: "idle" };
  } catch (e) {
    return {
      kind: "error",
      message:
        "재계산에 실패했어: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }
}

export interface DeepReadingState {
  kind: "idle" | "error";
  message?: string;
  /** true 면 비구독자 — 결제 CTA 표시. */
  premiumOnly?: boolean;
}

/**
 * 사주 심층 분석 생성/조회.
 *
 * - 비구독자: premiumOnly = true 반환 (UI 가 결제 CTA 표시)
 * - 구독자: 캐시 또는 신규 생성
 */
export async function generateDeepReadingAction(): Promise<DeepReadingState> {
  const { profile } = await requireProfile();

  try {
    enforceAiRateLimit(profile.userId, "saju");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return { kind: "error", message: `잠시 후 다시 시도해줘. (${e.retryAfterSec}s)` };
    }
    throw e;
  }

  const subscribed = await hasActiveSubscription(profile.userId);
  if (!subscribed) {
    const tErr = await getTranslations("actionErrors");
    return {
      kind: "error",
      premiumOnly: true,
      message: tErr("sajuDeepPremium"),
    };
  }

  const result = await getOrCreateDeepReading(profile);
  if (!result.ok) {
    return {
      kind: "error",
      message: result.message,
    };
  }

  revalidatePath("/saju");
  return { kind: "idle" };
}

// =============================================================================
// 오늘의 일진 × 내 사주 (라이트)
// =============================================================================

export interface IljinState {
  kind: "idle" | "success" | "error";
  data?: IljinAiOutput;
  relationships?: RelationshipResult[];
  message?: string;
}

const iljinCacheSchema = z.object({
  aiOutput: iljinAiSchema,
  relationships: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      energy: z.string(),
      detail: z.string(),
    }),
  ),
});

/**
 * 오늘 일진(日柱)과 내 사주의 충·합 관계를 분석하고 AI 해석을 생성한다.
 * 하루 1회 캐시.
 */
export async function generateIljinAction(): Promise<IljinState> {
  try {
    const { profile } = await requireProfile();

    const subscribed = await hasActiveSubscription(profile.userId);
    const tErr = await getTranslations("actionErrors");
    if (!subscribed) {
      return { kind: "error", message: tErr("premiumOnly") };
    }

    if (!profile.sajuPillars) {
      return { kind: "error", message: tErr("sajuRequired") };
    }

    // KST 기준 오늘 날짜 (YYYY-MM-DD)
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });

    // 캐시 조회
    const [cached] = await db
      .select()
      .from(dailyIljin)
      .where(
        and(
          eq(dailyIljin.userId, profile.userId),
          eq(dailyIljin.iljinDate, today),
        ),
      )
      .limit(1);

    if (cached) {
      const parsed = iljinCacheSchema.safeParse(cached.data);
      if (parsed.success) {
        return {
          kind: "success",
          data: parsed.data.aiOutput,
          relationships: parsed.data.relationships as RelationshipResult[],
        };
      }
    }

    // 오늘 일주 계산
    const todayPillar = getDayPillar(new Date());

    // 사주 4기둥
    const pillars = profile.sajuPillars as {
      year: { stem: string; branch: string } | null;
      month: { stem: string; branch: string } | null;
      day: { stem: string; branch: string } | null;
      hour: { stem: string; branch: string } | null;
    };

    // 충·합 분석
    const relationships = analyzeDayRelationship(
      todayPillar.stemIdx,
      todayPillar.branchIdx,
      pillars,
    );

    // AI 프롬프트
    const relText = relationships
      .map((r) => `${r.description}: ${r.detail}`)
      .join("\n");

    const userPrompt = `사용자 정보:
- 일주(日柱): ${pillars.day?.stem ?? ""}${pillars.day?.branch ?? ""}
- 전체 사주: 년${pillars.year?.stem ?? ""}${pillars.year?.branch ?? ""} 월${pillars.month?.stem ?? ""}${pillars.month?.branch ?? ""} 일${pillars.day?.stem ?? ""}${pillars.day?.branch ?? ""} 시${pillars.hour?.stem ?? ""}${pillars.hour?.branch ?? ""}

오늘 일주: ${todayPillar.stemHanja}${todayPillar.branchHanja}일 (${todayPillar.stemKo}${todayPillar.branchKo})

충·합 분석 결과:
${relText}

위 분석을 바탕으로 오늘 이 사람의 일진을 해석해줘.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼. 예언 투 금지.

[한자 표기 규칙 — 매우 중요]
응답에 천간(甲乙丙丁戊己庚辛壬癸)·지지(子丑寅卯辰巳午未申酉戌亥)·오행(木火土金水)·음양(陰陽) 한자가 등장할 때는 반드시 한자 바로 뒤에 한글 음을 괄호로 병기한다. 한국인 대부분이 한자를 못 읽기 때문.
예: 甲(갑), 子(자), 庚辛(경신), 木(목), 陽(양), 辛未(신미)일
한자만 단독으로 쓰지 말 것.

마크다운 없이 JSON만. overallEnergy 는 locale 무관 영문 enum 으로:
{
  "todayPillar": "${todayPillar.stemHanja}${todayPillar.branchHanja}일",
  "overallEnergy": "positive" 또는 "neutral" 또는 "caution",
  "mainMessage": "오늘 일진의 핵심 한두 문장",
  "advice": "오늘 하루 어떻게 지내면 좋을지 구체적 조언 2~3문장",
  "luckyTime": "어느 시간대가 좋은지",
  "caution": "주의할 것 한 문장"
}`;

    const rawAiOutput = await generateJson({
      schema: iljinAiSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
      locale: await getLocale(),
    });

    // 한자 옆에 한글 음 자동 병기 (AI 프롬프트로도 지시하지만 보안망).
    const aiOutput: IljinAiOutput = annotateHanjaDeep(rawAiOutput);

    const saveData = { aiOutput, relationships };

    if (cached) {
      await db
        .update(dailyIljin)
        .set({ data: saveData })
        .where(eq(dailyIljin.id, cached.id));
    } else {
      await db
        .insert(dailyIljin)
        .values({
          userId: profile.userId,
          iljinDate: today,
          data: saveData,
        })
        .onConflictDoNothing();
    }

    return { kind: "success", data: aiOutput, relationships };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : (await getTranslations("actionErrors"))("iljinError"),
    };
  }
}
