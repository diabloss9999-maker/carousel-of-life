/**
 * 앱 전역 상수.
 *
 * 매직 넘버·매직 문자열을 모두 이 파일에 정의한다.
 */

/** 무료 사용자 일일 한도. */
export const FREE_DAILY_LIMITS = {
  fortune: 2,
  tarot: 2,
  chat: 3,
} as const;

/** 구독 정보. */
export const SUBSCRIPTION = {
  monthlyPriceKRW: 4900,
  currency: "KRW",
  trialDays: 0,
} as const;

/** 단건 결제 상품. */
export const ONE_TIME_PRODUCTS = {
  fullSajuReport: { name: "정통 사주 풀이 (PDF)", priceKRW: 9900 },
  naming: { name: "작명 / 개명 추천", priceKRW: 14900 },
  newYearPackage: { name: "신년 운세 풀패키지", priceKRW: 19900 },
} as const;

/** AI 모델 식별자. 모델 교체 시 이 값만 바꾸면 된다. */
export const AI_MODELS = {
  /** 가벼운 작업 (사주 계산 등 짧은 JSON). */
  fast: "claude-haiku-4-5-20251001",
  /** 메인 풀이 (운세, 타로, 궁합). */
  premium: "claude-sonnet-4-6",
  /** 채팅 — 메인과 동일하지만 별도 키로 향후 교체 용이. */
  chat: "claude-sonnet-4-6",
} as const;

/** AI 응답 토큰 한도. */
export const AI_LIMITS = {
  sajuMaxTokens: 600,
  /** 사주 심층 분석 — 7개 섹션 × 5-10문장. */
  sajuDeepMaxTokens: 4500,
  fortuneMaxTokens: 2200, // 6-8문장 본문 + 메타 필드
  tarotMaxTokens: 2000,
  chatMaxTokens: 1024,
  systemPromptCacheTtl: 60 * 60, // 1 시간 (초 단위)
} as const;

/** 운세 카테고리. 라벨은 짧고 친근하게. */
export const FORTUNE_CATEGORIES = [
  { id: "general", label: "오늘의 운세", longLabel: "오늘의 종합 운" },
  { id: "love",    label: "사랑",        longLabel: "애정·연애 운" },
  { id: "money",   label: "재산",        longLabel: "금전·재물 운" },
  { id: "career",  label: "직장",        longLabel: "직장·취업 운" },
  { id: "health",  label: "건강",        longLabel: "건강 운" },
  { id: "study",   label: "학업",        longLabel: "학업·시험 운" },
  { id: "zodiac",  label: "별자리",      longLabel: "별자리 운세" },
  { id: "chinese_zodiac", label: "십이간지", longLabel: "십이간지 띠 운세" },
] as const;

export type FortuneCategoryId = (typeof FORTUNE_CATEGORIES)[number]["id"];

/** 타로 스프레드 종류. */
export const TAROT_SPREADS = [
  { id: "single", label: "오늘의 한 장", cardCount: 1, isFree: true },
  { id: "three", label: "과거-현재-미래", cardCount: 3, isFree: false },
  { id: "celtic", label: "켈틱 크로스", cardCount: 10, isFree: false },
] as const;

export type TarotSpreadId = (typeof TAROT_SPREADS)[number]["id"];

/** 라우트 경로. */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  onboarding: "/onboarding",
  today: "/today",
  chat: "/chat",
  tarot: "/tarot",
  saju: "/saju",
  compatibility: "/compatibility",
  history: "/history",
  personality: "/personality",
  settings: "/settings",
  pricing: "/pricing",
  authCallback: "/auth/callback",
} as const;
