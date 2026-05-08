import Link from "next/link";

import { cn } from "@/lib/utils";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "@/lib/constants";

interface CategoryTabsProps {
  current: FortuneCategoryId;
}

export function CategoryTabs({ current }: CategoryTabsProps) {
  return (
    <nav
      aria-label="운세 카테고리"
      className="flex flex-wrap gap-2 rounded-xl border border-border/45 bg-card/35 p-1.5 shadow-sm backdrop-blur"
    >
      {FORTUNE_CATEGORIES.map((cat) => {
        const isActive = cat.id === current;
        return (
          <Link
            key={cat.id}
            href={{ pathname: "/today", query: { category: cat.id } }}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {cat.label}
          </Link>
        );
      })}
    </nav>
  );
}
