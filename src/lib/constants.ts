import type { Route } from "next";

export const FREE_DAILY_LIMITS = {
  fortune: 2,
  tarot: 1,
  chat: 10,
  palm: 0,
} as const;

export const LITE_DAILY_LIMITS = {
  fortune: 20,
  tarot: 0,
  chat: 50,
  palm: 0,
} as const;

export const PRO_DAILY_LIMITS = {
  fortune: 40,
  tarot: 0,
  chat: 120,
  palm: 0,
} as const;

export type DailyLimitTier = "free" | "lite" | "pro";

export function fortuneQuestionLimitForTier(tier: DailyLimitTier): {
  fortune: number;
  question: number;
} {
  const limits =
    tier === "pro"
      ? PRO_DAILY_LIMITS
      : tier === "lite"
        ? LITE_DAILY_LIMITS
        : FREE_DAILY_LIMITS;

  return {
    fortune: limits.fortune + limits.tarot + limits.palm,
    question: limits.chat,
  };
}

export const GACHA_DAILY_LIMITS = {
  free: 1,
  lite: 3,
  pro: 5,
} as const;

export const GACHA_RARITY_BONUS: Record<string, number> = {
  common: 1,
  rare: 3,
  legendary: 7,
};

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

export const ONE_TIME_PRODUCTS = {
  fullSajuReport: { name: "정통 사주 분석(PDF)", priceKRW: 9900 },
  naming: { name: "작명 / 개명 추천", priceKRW: 14900 },
  newYearPackage: { name: "신년 운세 패키지", priceKRW: 19900 },
} as const;

export const AI_MODELS = {
  fast: "claude-haiku-4-5-20251001",
  premium: "claude-sonnet-4-6",
  chat: "claude-haiku-4-5-20251001",
} as const;

export const AI_LIMITS = {
  sajuMaxTokens: 600,
  sajuDeepMaxTokens: 8000,
  fortuneMaxTokens: 1900,
  tarotMaxTokens: 2000,
  compatibilityMaxTokens: 1500,
  chatMaxTokens: 1024,
  systemPromptCacheTtl: 60 * 60,
} as const;

export const FORTUNE_CATEGORIES = [
  { id: "general", label: "종합운세", longLabel: "오늘의 종합운세" },
  { id: "love", label: "연애운", longLabel: "오늘의 연애운" },
  { id: "money", label: "재물운", longLabel: "오늘의 재물운" },
  { id: "career", label: "커리어운", longLabel: "오늘의 커리어운" },
  { id: "health", label: "건강운", longLabel: "오늘의 건강운" },
  { id: "study", label: "공부운", longLabel: "오늘의 공부운" },
  { id: "zodiac", label: "별자리", longLabel: "별자리 운세" },
  { id: "chinese_zodiac", label: "띠운세", longLabel: "띠별 운세" },
] as const;

export type FortuneCategoryId = (typeof FORTUNE_CATEGORIES)[number]["id"];

export const TAROT_SPREADS = [
  { id: "single", label: "1장 타로", cardCount: 1, isFree: true },
  { id: "three", label: "과거-현재-미래", cardCount: 3, isFree: false },
  { id: "celtic", label: "켈틱 크로스", cardCount: 10, isFree: false },
] as const;

export type TarotSpreadId = (typeof TAROT_SPREADS)[number]["id"];

export const ROUTES = {
  home: "/",
  appHome: "/home" as Route,
  login: "/login",
  signup: "/signup",
  onboarding: "/onboarding",
  today: "/today",
  chat: "/chat",
  group: "/group",
  album: "/album",
  tarot: "/tarot",
  saju: "/saju",
  compatibility: "/compatibility",
  personality: "/personality",
  collection: "/collection",
  archive: "/archive",
  palm: "/palm",
  weekly: "/weekly",
  monthly: "/monthly",
  yearly: "/yearly",
  settings: "/settings",
  pricing: "/pricing",
  authCallback: "/auth/callback",
} as const;
