"use server";

/**
 * 오늘의 운세 — Server Action.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  dailyCareerTips,
  dailyHealthWorkouts,
  dailyStudyTips,
} from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { generateJson } from "@/lib/ai/generate";
import {
  careerReportSchema,
  type CareerReportOutput,
  healthWorkoutSchema,
  type HealthWorkoutOutput,
  studyTipsSchema,
  type StudyTipsOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import { getOrCreateDailyFortune } from "@/lib/fortunes/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

/** KST 오늘 날짜 YYYY-MM-DD */
function todayKst(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const categorySchema = z.enum([
  "general",
  "love",
  "money",
  "career",
  "health",
  "study",
  "zodiac",
  "chinese_zodiac",
]);

export interface FortuneActionState {
  kind: "idle" | "error";
  message?: string;
  /** 한도 초과 여부 (결제 CTA 노출용). */
  quotaExceeded?: boolean;
}

export async function generateFortuneAction(
  _prev: FortuneActionState,
  formData: FormData,
): Promise<FortuneActionState> {
  const parsed = categorySchema.safeParse(formData.get("category"));
  if (!parsed.success) {
    return {
      kind: "error",
      message: "카테고리가 올바르지 않아요.",
    };
  }

  const { profile } = await requireProfile();

  const result = await getOrCreateDailyFortune({
    profile,
    category: parsed.data,
  });

  if (result.ok) {
    revalidatePath("/today");
    return { kind: "idle" };
  }

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: `오늘의 운세 한도(${result.max}회)를 모두 사용했어요. 프리미엄 구독을 하시면 한도 없이 받으실 수 있어요.`,
    };
  }

  return {
    kind: "error",
    message: result.message,
  };
}

export interface CareerTipsState {
  kind: "idle" | "loading" | "success" | "error";
  report?: CareerReportOutput;
  message?: string;
}

/** KST 기준 한글 요일 ("월"~"일"). */
function todayWeekdayKst(): string {
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return WEEKDAYS[d.getDay()];
}

/**
 * 직장 운세 프리미엄 전용 — 4개 섹션 종합 리포트(에너지/타이밍/주간흐름/관계운) + 팁 3가지를 AI로 생성한다.
 *
 * - 프리미엄 구독자에게만 동작한다.
 * - 사용자 MBTI/생년월일/성별을 기반으로 개인화된 리포트를 생성한다.
 * - 동일 일자에 이미 생성된 리포트가 있으면 캐시를 재사용한다.
 */
export async function generateCareerTipsAction(): Promise<CareerTipsState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: "프리미엄 전용 기능이야." };
    }

    const today = todayKst();
    const weekday = todayWeekdayKst();

    // 오늘 이미 생성된 리포트가 있으면 재사용
    const [cached] = await db
      .select()
      .from(dailyCareerTips)
      .where(
        and(
          eq(dailyCareerTips.userId, profile.userId),
          eq(dailyCareerTips.tipDate, today),
        ),
      )
      .limit(1);

    if (cached) {
      // 신/구 스키마 모두 수용: 구버전 캐시(tips 배열만)는 무시하고 새로 생성하지 않고
      // 안전하게 파싱 시도 후 실패 시 새로 생성한다.
      const parsed = careerReportSchema.safeParse(cached.tips);
      if (parsed.success) {
        return { kind: "success", report: parsed.data };
      }
      // 구버전 캐시는 폐기하고 새로 생성
    }

    // AI 생성
    const mbti = profile.mbti ?? "알 수 없음";
    const userPrompt = `사용자 정보:
- MBTI: ${mbti}
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}
- 오늘 날짜: ${today} (${weekday}요일)

이 사용자의 오늘 직장 운세 종합 리포트를 작성해줘.
구체적이고 실천 가능하게, 이 사람의 MBTI 성격과 오늘 요일을 반영해서 작성해.

반드시 아래 JSON 형식으로만 응답해. 설명·마크다운 없이 JSON만 출력:
{
  "tips": [
    { "title": "팁 제목(10자 이내)", "description": "설명 2문장" },
    { "title": "팁 제목(10자 이내)", "description": "설명 2문장" },
    { "title": "팁 제목(10자 이내)", "description": "설명 2문장" }
  ],
  "energy": {
    "focus": 0~100,
    "relations": 0~100,
    "drive": 0~100,
    "avoid": "오늘 피해야 할 상황 1문장"
  },
  "timing": {
    "period": "morning" 또는 "afternoon",
    "periodDesc": "이유 1문장",
    "meetingTip": "회의·협상 팁 1문장"
  },
  "weeklyFlow": [
    { "day": "월", "forecast": "흐름 한 줄(15자 이내)", "score": 0~100 },
    { "day": "화", "forecast": "흐름 한 줄(15자 이내)", "score": 0~100 },
    { "day": "수", "forecast": "흐름 한 줄(15자 이내)", "score": 0~100 },
    { "day": "목", "forecast": "흐름 한 줄(15자 이내)", "score": 0~100 },
    { "day": "금", "forecast": "흐름 한 줄(15자 이내)", "score": 0~100 }
  ],
  "relationship": {
    "isGoodToAsk": true 또는 false,
    "bossAdvice": "상사 관계 팁 1문장",
    "colleagueTip": "동료 관계 팁 1문장",
    "standoutTip": "오늘 눈에 띄는 방법 1문장"
  }
}`;

    const result = await generateJson({
      schema: careerReportSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 1500,
      systemSuffix:
        "직장 운세 리포트 생성 전용 모드입니다. 산문·설명·마크다운은 일절 덧붙이지 말고 JSON만 응답하세요.",
    });

    // DB에 저장 (tips 컬럼에 전체 리포트 JSON 저장)
    // 구버전 캐시(팁 3개만) 가 있을 수 있으므로 충돌 시 업데이트한다.
    if (cached) {
      await db
        .update(dailyCareerTips)
        .set({ tips: result })
        .where(eq(dailyCareerTips.id, cached.id));
    } else {
      await db
        .insert(dailyCareerTips)
        .values({
          userId: profile.userId,
          tipDate: today,
          tips: result,
        })
        .onConflictDoNothing();
    }

    return { kind: "success", report: result };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "리포트를 불러오지 못했어.",
    };
  }
}

export interface HealthWorkoutState {
  kind: "idle" | "success" | "error";
  workouts?: HealthWorkoutOutput["workouts"];
  quote?: HealthWorkoutOutput["quote"];
  message?: string;
}

/**
 * 건강 운세 프리미엄 — 오늘의 맞춤 맨몸 운동 3가지를 AI 로 생성한다.
 *
 * - 프리미엄 구독자에게만 동작한다.
 * - MBTI/생년월일/성별 기반 맞춤 추천.
 * - 동일 일자 캐시 재사용.
 */
export async function generateHealthWorkoutAction(): Promise<HealthWorkoutState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: "프리미엄 전용 기능이야." };
    }

    const today = todayKst();

    const [cached] = await db
      .select()
      .from(dailyHealthWorkouts)
      .where(
        and(
          eq(dailyHealthWorkouts.userId, profile.userId),
          eq(dailyHealthWorkouts.workoutDate, today),
        ),
      )
      .limit(1);

    if (cached) {
      const parsed = healthWorkoutSchema.safeParse(cached.workouts);
      if (parsed.success) {
        return { kind: "success", workouts: parsed.data.workouts };
      }
    }

    const mbti = profile.mbti ?? "알 수 없음";
    const userPrompt = `사용자 정보:
- MBTI: ${mbti}
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}

이 사람에게 오늘 어울리는 맨몸 운동 3가지를 추천해줘.
기구 없이 집에서도 바로 할 수 있는 운동으로만 추천해.

반드시 아래 JSON 형식으로만 응답해. 설명·마크다운 없이 JSON만 출력:
{
  "workouts": [
    {
      "name": "운동 이름",
      "howTo": "어떻게 하는지 2~3문장",
      "benefit": "어디에 좋은지 1문장",
      "reps": "권장 세트/횟수 예: 3세트 × 15회"
    },
    { ... },
    { ... }
  ],
  "quote": {
    "text": "운동하고 싶게 만드는 뼈때리는 동기부여 명언 (한국어로)",
    "author": "명언 출처 인물명"
  }
}`;

    const result = await generateJson({
      schema: healthWorkoutSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 1200,
      systemSuffix:
        "운동 추천 전용 모드입니다. 마크다운·설명 없이 JSON만 응답하세요.",
    });

    if (cached) {
      await db
        .update(dailyHealthWorkouts)
        .set({ workouts: result })
        .where(eq(dailyHealthWorkouts.id, cached.id));
    } else {
      await db
        .insert(dailyHealthWorkouts)
        .values({
          userId: profile.userId,
          workoutDate: today,
          workouts: result,
        })
        .onConflictDoNothing();
    }

    return { kind: "success", workouts: result.workouts, quote: result.quote };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "운동을 불러오지 못했어.",
    };
  }
}

export interface StudyTipsState {
  kind: "idle" | "success" | "error";
  tips?: StudyTipsOutput["tips"];
  quote?: StudyTipsOutput["quote"];
  message?: string;
}

/**
 * 학업 운세 프리미엄 — MBTI 맞춤 집중력 팁 3가지를 AI 로 생성한다.
 *
 * - 프리미엄 구독자에게만 동작한다.
 * - 동일 일자 캐시 재사용.
 */
export async function generateStudyTipsAction(): Promise<StudyTipsState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: "프리미엄 전용 기능이야." };
    }

    const today = todayKst();

    const [cached] = await db
      .select()
      .from(dailyStudyTips)
      .where(
        and(
          eq(dailyStudyTips.userId, profile.userId),
          eq(dailyStudyTips.tipDate, today),
        ),
      )
      .limit(1);

    if (cached) {
      const parsed = studyTipsSchema.safeParse(cached.tips);
      if (parsed.success) {
        return { kind: "success", tips: parsed.data.tips };
      }
    }

    const mbti = profile.mbti ?? "알 수 없음";
    const userPrompt = `사용자 정보:
- MBTI: ${mbti}
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}

이 사람의 MBTI 성격에 맞는 "집중력 높이는 공부 팁" 3가지를 알려줘.
구체적이고 바로 실천 가능한 방법으로.

반드시 아래 JSON 형식으로만 응답해. 설명·마크다운 없이 JSON만 출력:
{
  "tips": [
    { "title": "팁 제목(10자 이내)", "description": "설명 2문장" },
    { "title": "팁 제목(10자 이내)", "description": "설명 2문장" },
    { "title": "팁 제목(10자 이내)", "description": "설명 2문장" }
  ],
  "quote": {
    "text": "철학자·수학자·과학자·기업 CEO 중 한 명의 학습과 성장에 관한 명언 (한국어로)",
    "author": "명언 출처 인물명 (직함 포함, 예: 아인슈타인 / 스티브 잡스 / 소크라테스)"
  }
}`;

    const result = await generateJson({
      schema: studyTipsSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix:
        "학습 팁 전용 모드입니다. 마크다운·설명 없이 JSON만 응답하세요.",
    });

    if (cached) {
      await db
        .update(dailyStudyTips)
        .set({ tips: result })
        .where(eq(dailyStudyTips.id, cached.id));
    } else {
      await db
        .insert(dailyStudyTips)
        .values({
          userId: profile.userId,
          tipDate: today,
          tips: result,
        })
        .onConflictDoNothing();
    }

    return { kind: "success", tips: result.tips, quote: result.quote };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "팁을 불러오지 못했어.",
    };
  }
}
