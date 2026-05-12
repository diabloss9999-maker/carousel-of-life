import Link from "next/link";

import { cn } from "@/lib/utils";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "@/lib/constants";

/** 라이트 전용 카테고리. */
const PREMIUM_CATEGORIES = new Set<FortuneCategoryId>(["zodiac", "chinese_zodiac"]);

interface CategoryTabsProps {
  current: FortuneCategoryId;
  subscribed?: boolean;
}

export function CategoryTabs({ current, subscribed = false }: CategoryTabsProps) {
  return (
    <nav
      aria-label="운세 카테고리"
      className="flex flex-wrap gap-2 rounded-xl border border-border/45 bg-card/35 p-1.5 shadow-sm backdrop-blur"
    >
      {FORTUNE_CATEGORIES.map((cat) => {
        const isActive = cat.id === current;
        const isPremium = PREMIUM_CATEGORIES.has(cat.id as FortuneCategoryId);
        const locked = isPremium && !subscribed;
        return (
          <Link
            key={cat.id}
            href={{ pathname: "/today", query: { category: cat.id } }}
            className={cn(
              "relative flex items-center gap-1 rounded-full px-3.5 py-2 text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{cat.label}</span>
            {isPremium && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide",
                  isActive
                    ? "bg-white/25 text-white"
                    : locked
                      ? "bg-amber-400/20 text-amber-500 dark:text-amber-400"
                      : "bg-primary/15 text-primary",
                )}
              >
                PRO
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
