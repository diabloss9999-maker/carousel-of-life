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
      className="flex flex-wrap gap-2 border-b border-border/40 pb-2"
    >
      {FORTUNE_CATEGORIES.map((cat) => {
        const isActive = cat.id === current;
        return (
          <Link
            key={cat.id}
            href={{ pathname: "/today", query: { category: cat.id } }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
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
