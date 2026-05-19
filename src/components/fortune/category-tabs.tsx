import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "@/lib/constants";

/** 라이트 전용 카테고리. */
const PREMIUM_CATEGORIES = new Set<FortuneCategoryId>(["zodiac", "chinese_zodiac"]);

/** 카테고리 id → i18n 키 (fortuneCard 네임스페이스 안에서) */
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

interface CategoryTabsProps {
  current: FortuneCategoryId;
  subscribed?: boolean;
}

export async function CategoryTabs({ current, subscribed = false }: CategoryTabsProps) {
  const t = await getTranslations("fortuneCard");
  const tToday = await getTranslations("today");
  const tTier = await getTranslations("tierBadge");
  return (
    <nav
      aria-label={tToday("title")}
      className="flex flex-wrap gap-2 rounded-xl border border-border/45 bg-card/35 p-1.5 shadow-sm backdrop-blur"
    >
      {FORTUNE_CATEGORIES.map((cat) => {
        const isActive = cat.id === current;
        const isPremium = PREMIUM_CATEGORIES.has(cat.id as FortuneCategoryId);
        const locked = isPremium && !subscribed;
        const key = CATEGORY_TKEY[cat.id as FortuneCategoryId];
        const label = key
          ? t(key as "categoryGeneral" | "categoryLove" | "categoryWealth" | "categoryCareer" | "categoryHealth" | "categoryStudy" | "categoryZodiac" | "categoryChineseZodiac")
          : cat.label;
        return (
          <Link
            key={cat.id}
            href={{ pathname: "/today", query: { category: cat.id } }}
            className={cn(
              "relative flex items-center gap-1 rounded-full px-3.5 py-2 text-[15px] transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{label}</span>
            {isPremium && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[15px] font-bold tracking-wide",
                  isActive
                    ? "bg-white/25 text-white"
                    : locked
                      ? "bg-amber-400/20 text-amber-500 dark:text-amber-400"
                      : "bg-primary/15 text-primary",
                )}
              >
                {tTier("lite")}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
