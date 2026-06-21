import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BirthdayBanner } from "@/components/fortune/birthday-banner";
import { CareerTips } from "@/components/fortune/career-tips";
import { FortuneCard } from "@/components/fortune/fortune-card";
import { GeneralPremium } from "@/components/fortune/general-premium";
import { GenerateFortuneForm } from "@/components/fortune/generate-fortune-form";
import { HealthWorkout } from "@/components/fortune/health-workout";
import { LottoGenerator } from "@/components/fortune/lotto-generator";
import { LoveCard } from "@/components/fortune/love-card";
import { PremiumFortuneGate } from "@/components/fortune/premium-fortune-gate";
import { StudyTips } from "@/components/fortune/study-tips";
import { TodaySummary } from "@/components/fortune/today-summary";
import { ZodiacBanner } from "@/components/fortune/zodiac-banner";
import { RelatableReadingCard } from "@/components/shared/relatable-reading-card";
import { WeeklyTimingStrip } from "@/components/today/weekly-timing-strip";
import { PhotocardTeaser } from "@/components/today/photocard-teaser";
import { MembershipSuccessBanner } from "@/components/subscription/membership-success-banner";
import { StreakNotifier } from "@/components/streak/streak-notifier";
import type { DailyFortune } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import {
  FORTUNE_CATEGORIES,
  ROUTES,
  type FortuneCategoryId,
} from "@/lib/constants";
import { getDailyFortune } from "@/lib/fortunes/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { isBirthdayTodayKst } from "@/lib/profile/birthday";
import { checkInStreak } from "@/lib/streak/service";
import { formatKoreanDate } from "@/lib/utils";

export const maxDuration = 30;

export const metadata: Metadata = {
  title: "오늘의 운세",
  description: "오늘의 운세와 별의 기운을 살펴봐요.",
};

const VALID_CATEGORIES = new Set<string>(FORTUNE_CATEGORIES.map((c) => c.id));

const CATEGORY_LONG_LABEL: Record<FortuneCategoryId, string> =
  Object.fromEntries(
    FORTUNE_CATEGORIES.map((c) => [c.id, c.longLabel]),
  ) as Record<FortuneCategoryId, string>;

interface TodayPageProps {
  searchParams: Promise<{ category?: string; subscribed?: string }>;
}

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const { category: rawCategory, subscribed: subscribedParam } = await searchParams;

  if (rawCategory && !VALID_CATEGORIES.has(rawCategory)) {
    redirect(ROUTES.today);
  }

  const category: FortuneCategoryId =
    (rawCategory as FortuneCategoryId | undefined) ?? "general";

  const { profile } = await requireProfile();
  const t = await getTranslations("today");

  const [fortune, subscribed, streakResult] = await Promise.all([
    getDailyFortune(profile.userId, category, undefined, profile).catch(() => null),
    hasActiveSubscription(profile.userId).catch(() => false),
    checkInStreak(profile.userId).catch(() => ({
      isNew: false,
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      bonusGachaCredits: 0,
      milestoneBonus: 0,
      wasReset: false,
      starPiecesAwarded: 0,
    })),
  ]);

  const summaryCategories: FortuneCategoryId[] = [
    "love",
    "money",
    "career",
    "health",
    "study",
  ];
  let summaryFortunes: Partial<Record<FortuneCategoryId, DailyFortune | null>> = {};

  if (category === "general") {
    const results = await Promise.all(
      summaryCategories.map((c) =>
        getDailyFortune(profile.userId, c, undefined, profile).catch(() => null),
      ),
    );
    summaryFortunes = summaryCategories.reduce<
      Partial<Record<FortuneCategoryId, DailyFortune | null>>
    >((acc, c, i) => {
      acc[c] = results[i];
      return acc;
    }, {});
  }

  const today = formatKoreanDate(new Date());
  const isPremiumCategory =
    category === "zodiac" || category === "chinese_zodiac";
  const showMembershipSuccess = subscribedParam === "1" && subscribed;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <StreakNotifier checkIn={streakResult} />
      {showMembershipSuccess ? <MembershipSuccessBanner /> : null}
      {isBirthdayTodayKst(profile.birthDate) ? (
        <BirthdayBanner displayName={profile.displayName ?? null} />
      ) : null}

      <header className="space-y-3">
        <p className="text-[14px] font-medium text-muted-foreground">{today}</p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
      </header>

      <WeeklyTimingStrip profile={profile} />

      <PhotocardTeaser />

      <RelatableReadingCard kind="fortune" category={category} />

      <ReadingValueStrip
        items={[
          {
            icon: Sparkles,
            label: "오늘의 핵심",
            value: "지금 조심할 것과 밀어붙일 것을 먼저 잡아요.",
          },
          {
            icon: Compass,
            label: "실천 기준",
            value: "감정, 관계, 일의 흐름을 행동으로 연결해요.",
          },
          {
            icon: CalendarDays,
            label: "다음 흐름",
            value: subscribed
              ? "월간·사주 심층까지 이어서 볼 수 있어요."
              : "멤버십에서 더 깊은 리포트가 열려요.",
          },
        ]}
      />

      <div id="today-reading" className="scroll-mt-24 space-y-6">
        {isPremiumCategory && !subscribed ? (
          <PremiumFortuneGate category={category} />
        ) : (
          <>
            {isPremiumCategory ? (
              <ZodiacBanner category={category} birthDate={profile.birthDate ?? null} />
            ) : null}

            {fortune ? (
              <div id="fortune-result" className="space-y-6">
                <FortuneCard fortune={fortune} />
                {category === "money" ? (
                  <LottoGenerator fortune={fortune} subscribed={subscribed} />
                ) : null}
                {category === "love" ? (
                  <LoveCard fortune={fortune} subscribed={subscribed} />
                ) : null}
                {category === "career" ? (
                  <CareerTips subscribed={subscribed} />
                ) : null}
                {category === "health" ? (
                  <HealthWorkout subscribed={subscribed} />
                ) : null}
                {category === "study" ? (
                  <StudyTips subscribed={subscribed} />
                ) : null}
                {category === "general" ? (
                  <GeneralPremium subscribed={subscribed} />
                ) : null}
                <TodayContinuation subscribed={subscribed} />
              </div>
            ) : (
              <GenerateFortuneForm
                category={category}
                categoryLabel={CATEGORY_LONG_LABEL[category]}
              />
            )}

            {category === "general" && fortune ? (
              <TodaySummary fortunes={summaryFortunes} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function TodayContinuation({ subscribed }: { subscribed: boolean }) {
  if (subscribed) {
    return (
      <section className="app-surface rounded-3xl border border-primary/20 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
              <p className="text-[13px] font-semibold">멤버십으로 이어보기</p>
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              오늘 흐름을 더 깊게 연결해요
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
              오늘운세에서 잡은 감각을 월간 흐름, 사주 심층, 타로 질문으로 바로 이어갈 수 있어요.
            </p>
          </div>
          <Link
            href={ROUTES.settings as Route}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary/10"
          >
            멤버십 확인
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ContinuationLink
            href={ROUTES.monthly as Route}
            icon={CalendarDays}
            title="월간운세"
            body="이번 달의 큰 흐름까지 이어보기"
          />
          <ContinuationLink
            href={ROUTES.saju as Route}
            icon={Compass}
            title="사주 심층"
            body="내 기질과 오늘 흐름 연결"
          />
          <ContinuationLink
            href={ROUTES.tarot as Route}
            icon={Sparkles}
            title="타로 질문"
            body="지금 고민을 카드로 다시 정리"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="app-surface rounded-3xl border border-primary/20 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden />
            <p className="text-[13px] font-semibold">심층 리포트 잠금</p>
          </div>
          <h2 className="mt-2 text-xl font-semibold">
            오늘운세 다음 흐름까지 열어보세요
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
            멤버십에서는 월간운세, 사주 심층, 분야별 흐름까지 이어서 볼 수 있어요.
          </p>
        </div>
        <Link
          href={ROUTES.pricing as Route}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground"
        >
          멤버십 보기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function ReadingValueStrip({
  items,
}: {
  items: Array<{ icon: LucideIcon; label: string; value: string }>;
}) {
  return (
    <section className="grid gap-2 sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3"
        >
          <div className="flex items-center gap-2 text-primary">
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <p className="text-[12px] font-semibold">{label}</p>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
            {value}
          </p>
        </div>
      ))}
    </section>
  );
}

function ContinuationLink({
  body,
  href,
  icon: Icon,
  title,
}: {
  body: string;
  href: Route;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:bg-white/[0.08]"
    >
      <span className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-[12px] font-semibold">바로 이어보기</span>
      </span>
      <span className="mt-3 block text-[15px] font-semibold">{title}</span>
      <span className="mt-1 block text-[13px] leading-5 text-muted-foreground">
        {body}
      </span>
      <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
        보러가기
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
