/**
 * AI 응답 구조 타입.
 *
 * AI 가 JSON 으로 응답한 결과를 zod 로 검증한 뒤 사용한다.
 */
import { z } from "zod";

export const dailyFortuneAiSchema = z.object({
  score: z.number().int().min(1).max(100),
  title: z.string().min(1).max(60),
  content: z.string().min(1).max(2000),
  luckyColor: z.string().min(1).max(20),
  luckyNumber: z.number().int().min(1).max(99),
  luckyDirection: z.string().min(1).max(20),
});

export type DailyFortuneAiOutput = z.infer<typeof dailyFortuneAiSchema>;

export const tarotSingleAiSchema = z.object({
  interpretation: z.string().min(1).max(2000),
  summary: z.string().min(1).max(80),
});

export type TarotSingleAiOutput = z.infer<typeof tarotSingleAiSchema>;

export const tarotThreeAiSchema = z.object({
  past: z.string().min(1).max(2000),
  present: z.string().min(1).max(2000),
  future: z.string().min(1).max(2000),
  synthesis: z.string().min(1).max(2000),
  summary: z.string().min(1).max(80),
});

export type TarotThreeAiOutput = z.infer<typeof tarotThreeAiSchema>;

/** 르노르망 풀이 (단일·3장 공용) AI 응답 스키마. */
export const lenormandSingleAiSchema = z.object({
  interpretation: z.string().min(1).max(2000),
  summary: z.string().min(1).max(80),
  cardCombination: z.string().min(1).max(400),
});

export type LenormandSingleAiOutput = z.infer<typeof lenormandSingleAiSchema>;

export const compatibilityAiSchema = z.object({
  score: z.number().int().min(1).max(100),
  summary: z.string().min(1).max(80),
  detail: z.string().min(1).max(2500),
});

export type CompatibilityAiOutput = z.infer<typeof compatibilityAiSchema>;

export const sajuDeepAiSchema = z.object({
  personality: z.string().min(1).max(2000),
  strengths: z.string().min(1).max(2000),
  cautions: z.string().min(1).max(2000),
  loveStyle: z.string().min(1).max(2000),
  careerFit: z.string().min(1).max(2000),
  healthCare: z.string().min(1).max(2000),
  lifeFlow: z.string().min(1).max(3000),
});

export type SajuDeepAiOutput = z.infer<typeof sajuDeepAiSchema>;

/**
 * 직장 운세 종합 리포트 스키마.
 *
 * - tips: 직장에서 예쁨받는 방법 3가지
 * - energy: 오늘의 에너지 리포트(집중력/대인관계/추진력 + 피해야 할 것)
 * - timing: 최적 업무 타이밍(오전/오후 + 회의 팁)
 * - weeklyFlow: 이번 주 직장 흐름(월~금 5일)
 * - relationship: 관계 운(부탁하기 좋은 날 여부 + 상사/동료/돋보임 팁)
 */
const numField = z.union([z.number(), z.string()]).transform(Number);

export const careerReportSchema = z.object({
  tips: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
  energy: z.object({
    focus: numField,
    relations: numField,
    drive: numField,
    avoid: z.string(),
  }),
  timing: z.object({
    period: z.string(),
    periodDesc: z.string(),
    meetingTip: z.string(),
  }),
  weeklyFlow: z.array(z.object({
    day: z.string(),
    forecast: z.string(),
    score: numField,
  })).min(1),
  relationship: z.object({
    isGoodToAsk: z.union([z.boolean(), z.string()]).transform((v) =>
      typeof v === "boolean" ? v : v === "true",
    ),
    bossAdvice: z.string(),
    colleagueTip: z.string(),
    standoutTip: z.string(),
  }),
});

export type CareerReportOutput = z.infer<typeof careerReportSchema>;

/**
 * @deprecated `careerReportSchema` 로 이전됨. 호환을 위해 alias 로 유지.
 */
export const careerTipsSchema = careerReportSchema;
export type CareerTipsOutput = CareerReportOutput;

/** 건강 — 오늘의 맨몸 운동 3가지 + 동기부여 명언 */
export const healthWorkoutSchema = z.object({
  workouts: z
    .array(
      z.object({
        name: z.string(),
        howTo: z.string(),
        benefit: z.string(),
        reps: z.string(),
      }),
    )
    .min(1),
  quote: z.object({
    text: z.string(),
    author: z.string(),
  }),
});
export type HealthWorkoutOutput = z.infer<typeof healthWorkoutSchema>;

/** 학업 — 집중력 높이는 팁 3가지 + 오늘의 명언 */
export const studyTipsSchema = z.object({
  tips: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
  quote: z.object({
    text: z.string(),   // 명언 본문
    author: z.string(), // 출처 (인물명)
  }),
});
export type StudyTipsOutput = z.infer<typeof studyTipsSchema>;

/** 사랑 프리미엄 — 오늘의 한마디 + 매력 팁 3가지 */
export const lovePremiumSchema = z.object({
  message: z.object({
    text: z.string(),      // 연인/짝에게 전할 한마디 (1~2문장)
    situation: z.string(), // 이 말이 어울리는 상황 1문장
  }),
  charmTips: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
});
export type LovePremiumOutput = z.infer<typeof lovePremiumSchema>;

/** 오늘의 일진 × 내 사주 — AI 해석 결과 */
export const iljinAiSchema = z.object({
  todayPillar: z.string().min(1).max(20),
  overallEnergy: z.string().min(1).max(20),
  mainMessage: z.string().min(1).max(400),
  advice: z.string().min(1).max(800),
  luckyTime: z.string().min(1).max(80),
  caution: z.string().min(1).max(200),
});
export type IljinAiOutput = z.infer<typeof iljinAiSchema>;
