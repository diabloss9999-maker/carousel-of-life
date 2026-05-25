import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 운세 생성 타임아웃 방지. */
export const maxDuration = 30;
import { redirect } from "next/navigation";

import { CareerTips } from "@/components/fortune/career-tips";
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
import { ShamanCall } from "@/components/chat/shaman-call";
import { StreakNotifier } from "@/components/streak/streak-notifier";
import type { DailyFortune } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import {
  FORTUNE_CATEGORIES,
  ROUTES,
  type FortuneCategoryId,
} from "@/lib/constants";
import { getDailyFortune } from "@/lib/fortunes/service";
import {
  getSubscriptionTier,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { getCrackScore } from "@/lib/crack/service";
import { getHomeHiddenText } from "@/lib/observe/hidden-events";
import { CrackAtmosphere } from "@/components/crack/crack-atmosphere";
import { checkInStreak } from "@/lib/streak/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { formatKoreanDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

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
  const t = await getTranslations("today");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  const [fortune, usage, subscribed, tier, streakResult, crackData] = await Promise.all([
    getDailyFortune(profile.userId, category),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
    getSubscriptionTier(profile.userId),
    checkInStreak(profile.userId),
    getCrackScore(profile.userId),
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
      <StreakNotifier checkIn={streakResult} />
      <header className="space-y-3">
        <div>
          <CrackAtmosphere
            crackLevel={crackData.level}
            todayStr={today}
            pageName={tNav("fortune")}
          />
          {(() => {
            const hidden = getHomeHiddenText(crackData.level, locale);
            return hidden ? (
              <p className="text-[15px] text-muted-foreground/50 tracking-widest mt-0.5 font-mystic italic">
                {hidden}
              </p>
            ) : null;
          })()}
        </div>
        <div>
          <h1
            data-fracture="today-title"
            className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            {t("title")}
          </h1>
        </div>
      </header>

      {/* 일일 사용량 — QuotaBar 자체에 app-surface 가 있어 외부 래퍼 제거 */}
      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
        tier={tier}
      />

      {/* 점술사 호출 */}
      <ShamanCall />

      {/* 별자리·십이간지 — 비구독자: 라이트 잠금 */}
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
              <FortuneCard fortune={fortune} crackLevel={crackData.level} />
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
