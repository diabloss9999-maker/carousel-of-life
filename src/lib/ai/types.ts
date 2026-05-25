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

/** 룬 풀이 AI 응답 스키마 (마크다운 본문 1필드). */
export const runeAiSchema = z.object({
  interpretation: z.string().min(1).max(5000),
});

export type RuneAiOutput = z.infer<typeof runeAiSchema>;

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
  /**
   * 사주 8글자 각 글자의 도출 근거 + 의미 풀이.
   * - 각 필드: 2-4문장. "이 글자가 왜 나왔는가 + 무엇을 상징하는가 + 너에게 어떤 의미인가"
   * - hourStem/hourBranch 는 태어난 시각 모를 때 null.
   * - 기존 캐시 호환을 위해 옵셔널.
   */
  pillarBreakdown: z
    .object({
      yearStem: z.string().min(1).max(800),
      yearBranch: z.string().min(1).max(800),
      monthStem: z.string().min(1).max(800),
      monthBranch: z.string().min(1).max(800),
      dayStem: z.string().min(1).max(800),
      dayBranch: z.string().min(1).max(800),
      hourStem: z.string().max(800).nullable(),
      hourBranch: z.string().max(800).nullable(),
      summary: z.string().min(1).max(1500),
    })
    .optional(),
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

/** weeklyFlow 의 요일 enum (월~금, locale 무관). */
export const CAREER_WEEKLY_DAY_VALUES = ["mon", "tue", "wed", "thu", "fri"] as const;
export type CareerWeeklyDay = (typeof CAREER_WEEKLY_DAY_VALUES)[number];

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
    /**
     * 영문 enum: "mon"|"tue"|"wed"|"thu"|"fri".
     * 구버전 캐시는 한글("월","화"...)이 올 수 있어 string 폴백을 허용한다 — 컴포넌트에서 정규화.
     */
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

const workoutItem = z.object({
  name: z.string(),
  howTo: z.string(),
  benefit: z.string(),
  reps: z.string(),
});

/** 건강 — 맨몸 운동 3가지 + 기구 운동 3가지 + 동기부여 명언 */
export const healthWorkoutSchema = z.object({
  bodyworkouts: z.array(workoutItem).min(1),
  gymWorkouts: z.array(workoutItem).min(1),
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

/** 사랑 라이트 — 오늘의 한마디 + 매력 팁 3가지 */
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

/** 종합 운세 라이트 — 시간대별 운세 + 6영역 점수 + DO/DON'T */
export const generalFortunePremiumSchema = z.object({
  timeSlots: z
    .array(
      z.object({
        label: z.string(), // "오전 (06~12시)"
        keyword: z.string(), // "집중력"
        advice: z.string(), // 한 문장
        score: numField, // 0~100
      }),
    )
    .min(1),
  scores: z.object({
    fortune: numField,
    love: numField,
    money: numField,
    career: numField,
    health: numField,
    study: numField,
  }),
  doList: z.array(z.string()).min(1),
  dontList: z.array(z.string()).min(1),
});
export type GeneralFortunePremiumOutput = z.infer<
  typeof generalFortunePremiumSchema
>;

/** 궁합 라이트 A — 관계 목적별 점수 (연애/결혼/비즈니스/친구) */
export const compatPurposeSchema = z.object({
  romance: numField,
  marriage: numField,
  business: numField,
  friendship: numField,
  bestPurpose: z.string(),
  worstPurpose: z.string(),
  summary: z.string(),
});
export type CompatPurposeOutput = z.infer<typeof compatPurposeSchema>;

/** 궁합 라이트 B — 갈등 패턴 + 화해법 */
export const compatConflictSchema = z.object({
  triggers: z.array(z.string()).min(1),
  pattern: z.string(),
  resolution: z.string(),
  avoidTip: z.string(),
});
export type CompatConflictOutput = z.infer<typeof compatConflictSchema>;

/** 궁합 라이트 C — 오늘 이 사람에게 어떻게? */
export const compatTodaySchema = z.object({
  isGoodDay: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "boolean" ? v : v === "true")),
  approach: z.string(),
  messageIdea: z.string(),
  caution: z.string(),
});
export type CompatTodayOutput = z.infer<typeof compatTodaySchema>;

/** 유형 라이트 D — 사주 × 별자리 × 성격유형 통합 분석 */
export const tripleAnalysisSchema = z.object({
  convergence: z.string(),
  contradiction: z.string(),
  trueNature: z.string(),
  uniqueStrength: z.string(),
});
export type TripleAnalysisOutput = z.infer<typeof tripleAnalysisSchema>;

/** 유형 라이트 E — 스트레스 유형 + 회복법 */
export const stressProfileSchema = z.object({
  triggers: z.array(z.string()).min(1),
  collapsePattern: z.string(),
  recoveryTips: z.array(z.string()).min(1),
  warningSign: z.string(),
});
export type StressProfileOutput = z.infer<typeof stressProfileSchema>;

/** 유형 라이트 F — 직업 적성 심층 리포트 */
export const careerFitSchema = z.object({
  bestEnvironment: z.string(),
  fitRoles: z.array(z.string()).min(1),
  avoidEnvironments: z.string(),
  workStyle: z.string(),
  growthTip: z.string(),
});
export type CareerFitOutput = z.infer<typeof careerFitSchema>;

/** 일진 분석의 전체 에너지 enum (locale 무관). */
export const ILJIN_ENERGY_VALUES = ["positive", "neutral", "caution"] as const;
export type IljinEnergy = (typeof ILJIN_ENERGY_VALUES)[number];

/**
 * 오늘의 일진 × 내 사주 — AI 해석 결과.
 *
 * - overallEnergy: 영문 enum (positive | neutral | caution).
 *   구버전 캐시의 한글 값은 컴포넌트 폴백에서 처리한다.
 */
export const iljinAiSchema = z.object({
  todayPillar: z.string().min(1).max(20),
  overallEnergy: z.enum(ILJIN_ENERGY_VALUES),
  mainMessage: z.string().min(1).max(400),
  advice: z.string().min(1).max(800),
  luckyTime: z.string().min(1).max(300),
  caution: z.string().min(1).max(300),
});
export type IljinAiOutput = z.infer<typeof iljinAiSchema>;

/** 꿈해몽 풀이 AI 응답. */
export const dreamReadingAiSchema = z.object({
  /** 한 줄 핵심 요약 (40자 이내). */
  summary: z.string().min(1).max(80),
  /** 길흉 — 좋음/주의/나쁨/중립. */
  fortune: z.enum(["good", "caution", "bad", "neutral"]),
  /** 꿈의 의미 — 사주·상징·동양 해석 기반. */
  meaning: z.string().min(1).max(1500),
  /** 사용자 사주와의 연결 — 일간·오행과 어떻게 이어지는지. */
  sajuConnection: z.string().min(1).max(800),
  /** 행동 권유 — 오늘·이번 주에 해볼 만한 것. */
  advice: z.string().min(1).max(600),
});
export type DreamReadingAiOutput = z.infer<typeof dreamReadingAiSchema>;

/** 이름풀이 AI 응답. */
export const nameReadingAiSchema = z.object({
  /** 한 줄 요약 (40자 이내). */
  summary: z.string().min(1).max(80),
  /** 전체 평가 점수 (1-100). */
  score: z.number().int().min(1).max(100),
  /** 한자/한글 의미 분석. */
  meaning: z.string().min(1).max(1000),
  /** 사주(일간·오행)와의 상생/상극. */
  sajuHarmony: z.string().min(1).max(800),
  /** 운세 흐름 (사회운·재물운·건강운). */
  fortune: z.string().min(1).max(1000),
  /** 권유·주의 사항. */
  advice: z.string().min(1).max(600),
});
export type NameReadingAiOutput = z.infer<typeof nameReadingAiSchema>;

/** 이름 궁합 AI 응답 — 짧고 빠른 풀이. */
export const nameCompatibilityAiSchema = z.object({
  /** 한 줄 요약 (40자 이내). 점술사 톤. */
  headline: z.string().min(1).max(80),
  /** 본문 3-4줄 풀이 (두 이름의 결을 짚어주는). */
  reading: z.string().min(1).max(500),
  /** 권유 한 줄 — 두 사람에게 어떤 마음가짐이 좋을지. */
  advice: z.string().min(1).max(200),
});
export type NameCompatibilityAiOutput = z.infer<typeof nameCompatibilityAiSchema>;
