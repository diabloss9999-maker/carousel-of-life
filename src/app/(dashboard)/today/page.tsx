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

import Link from "next/link";
import type { Route } from "next";
import { BookMarked, Globe2, Flame, Gift } from "lucide-react";
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
import { getTodayMood } from "@/lib/mood/service";
import { MoodCapture } from "@/components/mood/mood-capture";
import { getCrackScore } from "@/lib/crack/service";
import { getHomeHiddenText } from "@/lib/observe/hidden-events";
import { CrackAtmosphere } from "@/components/crack/crack-atmosphere";
import { WorldStatusPanel } from "@/components/world/world-status-panel";
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
  const tExtras = await getTranslations("todayExtras");
  const locale = await getLocale();

  const [fortune, usage, subscribed, tier, streakResult, todayMood, crackData] = await Promise.all([
    getDailyFortune(profile.userId, category),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
    getSubscriptionTier(profile.userId),
    checkInStreak(profile.userId),
    // 모든 탭에서 오늘 기분을 조회 — MoodCapture 가 페이지 상단 고정이라 탭 무관 일관성 유지.
    getTodayMood(profile.userId),
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
              <p className="text-[9px] text-muted-foreground/50 tracking-widest mt-0.5 font-mystic italic">
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
          <p className="mt-1.5 text-sm text-muted-foreground">
            {profile.displayName
              ? t("subtitleWithName", { name: profile.displayName })
              : t("subtitleNoName")}
          </p>
        </div>
      </header>

      {/* 일일 사용량 — 페이지 진입 시 즉시 보이도록 헤더 바로 아래에 고정 배치 */}
      <div className="rounded-2xl ring-1 ring-primary/25 shadow-lg shadow-primary/5">
        <QuotaBar
          fortuneCount={usage.fortuneCount}
          tarotCount={usage.tarotCount}
          chatCount={usage.chatCount}
          tier={tier}
        />
      </div>

      {/* 오늘의 세계 상태 — 균열 측정 + 관측 로그 */}
      <WorldStatusPanel crackScore={crackData.score} crackLevel={crackData.level} />

      {/* 오늘 기분 — 운세 생성 전부터 페이지 진입 시 바로 입력 가능 */}
      <MoodCapture todayMood={todayMood?.mood ?? null} source="today_top" />

      {/* 주술사 호출 — 먼저 말을 건다 */}
      <ShamanCall />

      {/* 보관 · 세계 · 연속 흐름 — 메뉴바 대체 진입 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href={ROUTES.archive as Route}
          className="app-surface rounded-xl p-3 sm:p-4 flex flex-col items-start gap-1.5 transition-transform hover:-translate-y-0.5"
        >
          <BookMarked className="h-4 w-4 text-accent" aria-hidden />
          <span className="font-mystic text-sm font-semibold">{tExtras("archive")}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{tExtras("archiveSub")}</span>
        </Link>
        <Link
          href={ROUTES.world as Route}
          className="app-surface rounded-xl p-3 sm:p-4 flex flex-col items-start gap-1.5 transition-transform hover:-translate-y-0.5"
        >
          <Globe2 className="h-4 w-4 text-accent" aria-hidden />
          <span className="font-mystic text-sm font-semibold">{tExtras("world")}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{tExtras("worldSub")}</span>
        </Link>
        <Link
          href={ROUTES.history}
          className="app-surface rounded-xl p-3 sm:p-4 flex flex-col items-start gap-1.5 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-2 w-full">
            <Flame className="h-4 w-4 text-accent" aria-hidden />
            {streakResult.bonusGachaCredits > 0 && (
              <span className="ml-auto flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                <Gift className="h-2.5 w-2.5" aria-hidden />
                +{streakResult.bonusGachaCredits}
              </span>
            )}
          </div>
          <span className="font-mystic text-sm font-semibold tabular-nums">
            {tExtras("streakDaysRow", { n: streakResult.currentStreak })}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {streakResult.currentStreak >= 3 ? tExtras("streakActive") : tExtras("streakNew")}
          </span>
        </Link>
      </div>

      <CategoryTabs current={category} subscribed={subscribed} />

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
