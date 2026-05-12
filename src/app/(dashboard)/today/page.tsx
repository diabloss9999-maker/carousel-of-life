import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 운세 생성 타임아웃 방지. */
export const maxDuration = 30;
import { redirect } from "next/navigation";

import { CareerTips } from "@/components/fortune/career-tips";
import { CategoryTabs } from "@/components/fortune/category-tabs";
import { FortuneCard } from "@/components/fortune/fortune-card";
import { GeneralPremium } from "@/components/fortune/general-premium";
import { HealthWorkout } from "@/components/fortune/health-workout";
import { LottoGenerator } from "@/components/fortune/lotto-generator";
import { LoveCard } from "@/components/fortune/love-card";
import { PremiumFortuneGate } from "@/components/fortune/premium-fortune-gate";
import { StudyTips } from "@/components/fortune/study-tips";

import { GenerateFortuneForm } from "@/components/fortune/generate-fortune-form";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { TodaySummary } from "@/components/fortune/today-summary";
import { ZodiacBanner } from "@/components/fortune/zodiac-banner";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { StreakBadge } from "@/components/streak/streak-badge";
import type { DailyFortune } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import {
  FORTUNE_CATEGORIES,
  ROUTES,
  type FortuneCategoryId,
} from "@/lib/constants";
import { getDailyFortune } from "@/lib/fortunes/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { checkInStreak } from "@/lib/streak/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { formatKoreanDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "오늘의 운세",
  description: "오늘의 운세와 별의 흐름을 살펴봐요.",
};

const VALID_CATEGORIES = new Set<string>(
  FORTUNE_CATEGORIES.map((c) => c.id),
);

const CATEGORY_LONG_LABEL: Record<FortuneCategoryId, string> =
  Object.fromEntries(
    FORTUNE_CATEGORIES.map((c) => [c.id, c.longLabel]),
  ) as Record<FortuneCategoryId, string>;

interface TodayPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const { category: rawCategory } = await searchParams;

  if (rawCategory && !VALID_CATEGORIES.has(rawCategory)) {
    redirect(ROUTES.today);
  }
  const category: FortuneCategoryId =
    (rawCategory as FortuneCategoryId | undefined) ?? "general";

  const { profile } = await requireProfile();

  const [fortune, usage, subscribed, streakResult] = await Promise.all([
    getDailyFortune(profile.userId, category),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
    checkInStreak(profile.userId),
  ]);

  // general 탭에서만 다른 카테고리들의 오늘 운세를 병렬 조회한다.
  const SUMMARY_CATEGORIES: FortuneCategoryId[] = [
    "love",
    "money",
    "career",
    "health",
    "study",
  ];
  let summaryFortunes: Partial<Record<FortuneCategoryId, DailyFortune | null>> = {};
  if (category === "general") {
    const results = await Promise.all(
      SUMMARY_CATEGORIES.map((c) => getDailyFortune(profile.userId, c)),
    );
    summaryFortunes = SUMMARY_CATEGORIES.reduce<
      Partial<Record<FortuneCategoryId, DailyFortune | null>>
    >((acc, c, i) => {
      acc[c] = results[i];
      return acc;
    }, {});
  }

  const today = formatKoreanDate(new Date());

  /** 별자리·십이간지는 비구독자에게 잠금 UI 표시. */
  const isPremiumCategory =
    category === "zodiac" || category === "chinese_zodiac";

  return (
    <div className="space-y-8">
      <OnboardingModal />
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{today}</p>
          <StreakBadge checkIn={streakResult} />
        </div>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          오늘의 흐름
        </h1>
        <p className="text-muted-foreground">
          {profile.displayName ? `${profile.displayName}의 ` : ""}
          오늘 별의 기운이 무엇을 말하는지 읽어줄게.
        </p>
      </header>

      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
        subscribed={subscribed}
      />

      <CategoryTabs current={category} subscribed={subscribed} />

      {/* 별자리·십이간지 — 비구독자: 프리미엄 잠금 */}
      {isPremiumCategory && !subscribed ? (
        <PremiumFortuneGate category={category} />
      ) : (
        <>
          {/* 별자리·12간지 카드 배너 */}
          {isPremiumCategory && (
            <ZodiacBanner category={category} birthDate={profile.birthDate ?? null} />
          )}

          {fortune ? (
            <div id="fortune-result" className="space-y-6">
              <FortuneCard fortune={fortune} />
              {category === "money" && (
                <LottoGenerator fortune={fortune} subscribed={subscribed} />
              )}
              {category === "love" && (
                <LoveCard fortune={fortune} subscribed={subscribed} />
              )}
              {category === "career" && (
                <CareerTips subscribed={subscribed} />
              )}
              {category === "health" && (
                <HealthWorkout subscribed={subscribed} />
              )}
              {category === "study" && (
                <StudyTips subscribed={subscribed} />
              )}
              {category === "general" && (
                <GeneralPremium subscribed={subscribed} />
              )}
            </div>
          ) : (
            <GenerateFortuneForm
              category={category}
              categoryLabel={CATEGORY_LONG_LABEL[category]}
            />
          )}

          {category === "general" && fortune && (
            <TodaySummary fortunes={summaryFortunes} />
          )}
        </>
      )}
    </div>
  );
}
