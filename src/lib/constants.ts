/**
 * 앱 전역 상수.
 *
 * 매직 넘버·매직 문자열을 모두 이 파일에 정의한다.
 */

/** 무료 사용자 일일 한도. */
export const FREE_DAILY_LIMITS = {
  fortune: 2,
  tarot: 1,
  chat: 5,
} as const;

/** 라이트 구독자 일일 한도 (₩4,900). */
export const LITE_DAILY_LIMITS = {
  fortune: 10,
  tarot: 10,
  chat: 50,
} as const;

/** 프로 구독자 일일 한도 (₩9,900). */
export const PRO_DAILY_LIMITS = {
  fortune: 20,
  tarot: 20,
  chat: 120,
} as const;

/** 구독 플랜 정보. */
export const SUBSCRIPTION = {
  lite: {
    monthlyPriceKRW: 4900,
    label: "라이트",
  },
  pro: {
    monthlyPriceKRW: 9900,
    label: "프로",
  },
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
  /** 채팅 — Haiku 사용으로 비용 절감 (Sonnet 대비 ~20배 저렴). */
  chat: "claude-haiku-4-5-20251001",
} as const;

/** AI 응답 토큰 한도. */
export const AI_LIMITS = {
  sajuMaxTokens: 600,
  /** 사주 심층 분석 — 7개 섹션 × 5-10문장. */
  sajuDeepMaxTokens: 4500,
  fortuneMaxTokens: 2200, // 6-8문장 본문 + 메타 필드
  tarotMaxTokens: 2000,
  /**
   * 궁합 풀이 — Vercel Hobby 30s 타임아웃 내에 완료하기 위해
   * 1 500 토큰으로 제한. Sonnet 기준 약 10~15s 소요.
   */
  compatibilityMaxTokens: 1500,
  chatMaxTokens: 1024,
  systemPromptCacheTtl: 60 * 60, // 1 시간 (초 단위)
} as const;

/** 운세 카테고리. 라벨은 짧고 친근하게. */
export const FORTUNE_CATEGORIES = [
  { id: "general",        label: "오늘의 흐름",   longLabel: "오늘의 흐름" },
  { id: "love",           label: "인연의 잔향",   longLabel: "인연의 잔향" },
  { id: "money",          label: "금빛 흐름",     longLabel: "금빛 흐름" },
  { id: "career",         label: "사명의 자리",   longLabel: "사명의 자리" },
  { id: "health",         label: "몸의 신호",     longLabel: "몸의 신호" },
  { id: "study",          label: "지혜의 궤도",   longLabel: "지혜의 궤도" },
  { id: "zodiac",         label: "별의 기록",     longLabel: "별의 기록" },
  { id: "chinese_zodiac", label: "태어난 짐승",   longLabel: "태어난 짐승" },
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
  collection: "/collection",
  settings: "/settings",
  pricing: "/pricing",
  authCallback: "/auth/callback",
} as const;
