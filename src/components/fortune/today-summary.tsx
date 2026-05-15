/**
 * 오늘의 종합 운(general) 탭 하단에 표시되는 다른 카테고리 요약 카드 그리드.
 * 이미 뽑힌 카테고리만 미니 카드로 노출하며, 각 카드는 해당 탭으로 이동한다.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import {
  ROUTES,
  type FortuneCategoryId,
} from "@/lib/constants";

interface TodaySummaryProps {
  /** 카테고리 → 해당 카테고리의 오늘 운세 (없으면 null). */
  fortunes: Partial<Record<FortuneCategoryId, DailyFortune | null>>;
}

/** 카테고리 → fortuneCard 의 i18n 키. */
const CATEGORY_TKEY: Record<FortuneCategoryId, string> = {
  general: "categoryGeneral",
  love: "categoryLove",
  money: "categoryWealth",
  career: "categoryCareer",
  health: "categoryHealth",
  study: "categoryStudy",
  zodiac: "categoryZodiac",
  chinese_zodiac: "categoryChineseZodiac",
};

/** 종합 운 카드 아래에 노출할 보조 카테고리 순서. */
const SECONDARY_CATEGORIES: FortuneCategoryId[] = [
  "love",
  "money",
  "career",
  "health",
  "study",
];

export async function TodaySummary({ fortunes }: TodaySummaryProps) {
  const items = SECONDARY_CATEGORIES.flatMap((id) => {
    const f = fortunes[id];
    if (!f) return [];
    return [{ id, fortune: f }];
  });

  if (items.length === 0) {
    return null;
  }

  const t = await getTranslations("todaySummary");
  const tCat = await getTranslations("fortuneCard");

  return (
    <section className="space-y-3">
      <h3 className="font-mystic text-lg font-semibold tracking-tight">
        {t("title")}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ id, fortune }) => {
          const key = CATEGORY_TKEY[id];
          const label = key
            ? tCat(key as "categoryGeneral" | "categoryLove" | "categoryWealth" | "categoryCareer" | "categoryHealth" | "categoryStudy" | "categoryZodiac" | "categoryChineseZodiac")
            : id;
          return (
            <Link
              key={id}
              href={`${ROUTES.today}?category=${id}`}
              className="group block focus:outline-none"
            >
              <Card className="app-surface h-full transition group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-primary/40">
                <CardContent className="space-y-2 p-4">
                  <span className="text-[15px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <p className="font-mystic line-clamp-1 text-base font-semibold leading-snug">
                    {fortune.title}
                  </p>
                  <p className="text-[15px] text-muted-foreground">
                    {t("viewMore")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
