"use server";

/**
 * 유형(personality) 페이지 — 프리미엄 Server Actions 3종.
 *
 * D. 사주 × 별자리 × 성격유형 통합 분석
 * E. 스트레스 유형 + 회복법
 * F. 직업 적성 심층 리포트
 *
 * 셋 모두 사용자별로 한 번만 생성되고 DB에 영구 저장된다.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  personalityCareerFit,
  personalityStressProfile,
  personalityTripleAnalysis,
} from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { generateJson } from "@/lib/ai/generate";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
import {
  careerFitSchema,
  type CareerFitOutput,
  stressProfileSchema,
  type StressProfileOutput,
  tripleAnalysisSchema,
  type TripleAnalysisOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getZodiacSign } from "@/lib/fortunes/zodiac";

const PREMIUM_ONLY_MESSAGE = "프리미엄 전용 기능이야.";

export interface TripleAnalysisState {
  kind: "idle" | "success" | "error";
  data?: TripleAnalysisOutput;
  message?: string;
}

/**
 * 사주·별자리·성격유형 3 시스템 통합 분석 — 사용자당 1회 생성, 영구 캐시.
 */
export async function generateTripleAnalysisAction(): Promise<TripleAnalysisState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: PREMIUM_ONLY_MESSAGE };
    }

    if (!profile.mbti) {
      return {
        kind: "error",
        message: "먼저 성격유형 테스트를 완료해 줘.",
      };
    }

    const [cached] = await db
      .select()
      .from(personalityTripleAnalysis)
      .where(eq(personalityTripleAnalysis.userId, profile.userId))
      .limit(1);

    if (cached) {
      const parsed = tripleAnalysisSchema.safeParse(cached.data);
      if (parsed.success) {
        return { kind: "success", data: parsed.data };
      }
    }

    const zodiac = getZodiacSign(profile.birthDate);
    const sajuLine = profile.sajuPillars
      ? `사주 8자: ${JSON.stringify(profile.sajuPillars)}`
      : "사주 8자: (계산되지 않음)";

    const userPrompt = `사용자 정보:
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}
- MBTI: ${profile.mbti}
- 별자리: ${zodiac.ko} (${zodiac.dateRange})
- ${sajuLine}

[지시]
사주·별자리(${zodiac.ko})·성격유형(${profile.mbti}) 세 시스템이 동시에 말하는 이 사람의 진짜 성격을 분석해줘.
세 시스템이 서로 모순될 수도 있고 같은 방향을 가리킬 수도 있어. 그 결을 솔직하게 짚어줘.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.

반드시 아래 JSON 형식으로만 응답해. 마크다운·설명 없이 JSON만:
{
  "convergence": "사주·별자리·성격유형이 공통으로 말하는 성격 — 캐릭터 말투로 2~3문장",
  "contradiction": "서로 모순되거나 다른 측면 — 캐릭터 말투로 1~2문장",
  "trueNature": "세 시스템을 통합해서 도출한 진짜 본성 — 캐릭터 말투로 2~3문장",
  "uniqueStrength": "이 조합만의 독특한 강점 — 캐릭터 말투로 1~2문장"
}`;

    const data = await generateJson({
      schema: tripleAnalysisSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
    });

    if (cached) {
      await db
        .update(personalityTripleAnalysis)
        .set({ data })
        .where(eq(personalityTripleAnalysis.id, cached.id));
    } else {
      await db
        .insert(personalityTripleAnalysis)
        .values({ userId: profile.userId, data })
        .onConflictDoNothing();
    }

    return { kind: "success", data };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "분석에 실패했어.",
    };
  }
}

export interface StressProfileState {
  kind: "idle" | "success" | "error";
  data?: StressProfileOutput;
  message?: string;
}

/**
 * 스트레스 유형 + 회복법 — 사용자당 1회 생성, 영구 캐시.
 */
export async function generateStressProfileAction(): Promise<StressProfileState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: PREMIUM_ONLY_MESSAGE };
    }

    if (!profile.mbti) {
      return {
        kind: "error",
        message: "먼저 성격유형 테스트를 완료해 줘.",
      };
    }

    const [cached] = await db
      .select()
      .from(personalityStressProfile)
      .where(eq(personalityStressProfile.userId, profile.userId))
      .limit(1);

    if (cached) {
      const parsed = stressProfileSchema.safeParse(cached.data);
      if (parsed.success) {
        return { kind: "success", data: parsed.data };
      }
    }

    const userPrompt = `사용자 정보:
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}
- MBTI: ${profile.mbti}

[지시]
${profile.mbti} 유형이 스트레스를 받을 때 어떻게 무너지는지 + 빠른 회복법을 분석해줘.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.

반드시 아래 JSON 형식으로만 응답해. 마크다운·설명 없이 JSON만:
{
  "triggers": ["스트레스 유발 상황 — 캐릭터 말투로", "스트레스 유발 상황 2", "스트레스 유발 상황 3"],
  "collapsePattern": "${profile.mbti} 가 무너질 때 패턴 — 캐릭터 말투로 2문장",
  "recoveryTips": ["회복법 — 캐릭터 말투로", "회복법 2", "회복법 3"],
  "warningSign": "위험 신호 — 캐릭터 말투로 1문장"
}`;

    const data = await generateJson({
      schema: stressProfileSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
    });

    if (cached) {
      await db
        .update(personalityStressProfile)
        .set({ data })
        .where(eq(personalityStressProfile.id, cached.id));
    } else {
      await db
        .insert(personalityStressProfile)
        .values({ userId: profile.userId, data })
        .onConflictDoNothing();
    }

    return { kind: "success", data };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "분석에 실패했어.",
    };
  }
}

export interface CareerFitState {
  kind: "idle" | "success" | "error";
  data?: CareerFitOutput;
  message?: string;
}

/**
 * 직업 적성 심층 리포트 — 사용자당 1회 생성, 영구 캐시.
 */
export async function generateCareerFitAction(): Promise<CareerFitState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: PREMIUM_ONLY_MESSAGE };
    }

    if (!profile.mbti) {
      return {
        kind: "error",
        message: "먼저 성격유형 테스트를 완료해 줘.",
      };
    }

    const [cached] = await db
      .select()
      .from(personalityCareerFit)
      .where(eq(personalityCareerFit.userId, profile.userId))
      .limit(1);

    if (cached) {
      const parsed = careerFitSchema.safeParse(cached.data);
      if (parsed.success) {
        return { kind: "success", data: parsed.data };
      }
    }

    const userPrompt = `사용자 정보:
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}
- MBTI: ${profile.mbti}

[지시]
${profile.mbti} 유형 기반으로 어떤 업무 환경·직군이 잘 맞는지 심층 리포트를 작성해줘.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.

반드시 아래 JSON 형식으로만 응답해. 마크다운·설명 없이 JSON만:
{
  "bestEnvironment": "${profile.mbti} 가 빛나는 업무 환경 — 캐릭터 말투로 2문장",
  "fitRoles": ["잘 맞는 직군 1", "잘 맞는 직군 2", "잘 맞는 직군 3", "잘 맞는 직군 4", "잘 맞는 직군 5"],
  "avoidEnvironments": "피해야 할 환경 — 캐릭터 말투로 1~2문장",
  "workStyle": "${profile.mbti} 업무 스타일 — 캐릭터 말투로 2문장",
  "growthTip": "성장 팁 — 캐릭터 말투로 1~2문장"
}`;

    const data = await generateJson({
      schema: careerFitSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
    });

    if (cached) {
      await db
        .update(personalityCareerFit)
        .set({ data })
        .where(eq(personalityCareerFit.id, cached.id));
    } else {
      await db
        .insert(personalityCareerFit)
        .values({ userId: profile.userId, data })
        .onConflictDoNothing();
    }

    return { kind: "success", data };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "분석에 실패했어.",
    };
  }
}
