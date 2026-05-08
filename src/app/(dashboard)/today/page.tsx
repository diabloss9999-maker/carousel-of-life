import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CategoryTabs } from "@/components/fortune/category-tabs";
import { FortuneCard } from "@/components/fortune/fortune-card";
import { FortuneTrendCard } from "@/components/fortune/fortune-trend-card";
import { GenerateFortuneForm } from "@/components/fortune/generate-fortune-form";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { requireProfile } from "@/lib/auth/get-user";
import {
  FORTUNE_CATEGORIES,
  ROUTES,
  type FortuneCategoryId,
} from "@/lib/constants";
import { getDailyFortune } from "@/lib/fortunes/service";
import { getFortuneTrend } from "@/lib/fortunes/trend";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
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

  const [fortune, usage, subscribed, trend] = await Promise.all([
    getDailyFortune(profile.userId, category),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
    getFortuneTrend(profile.userId, 14),
  ]);

  const today = formatKoreanDate(new Date());

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          오늘의 운세
        </h1>
        <p className="text-muted-foreground">
          {profile.displayName ? `${profile.displayName}님, ` : ""}
          오늘 어떤 기운이 흐르는지 살펴볼게요.
        </p>
      </header>

      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
        subscribed={subscribed}
      />

      <CategoryTabs current={category} />

      {fortune ? (
        <FortuneCard fortune={fortune} />
      ) : (
        <GenerateFortuneForm
          category={category}
          categoryLabel={CATEGORY_LONG_LABEL[category]}
        />
      )}

      {category === "general" && <FortuneTrendCard trend={trend} />}
    </div>
  );
}
