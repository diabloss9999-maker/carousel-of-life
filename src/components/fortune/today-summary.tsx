/**
 * 오늘의 종합 운(general) 탭 하단에 표시되는 다른 카테고리 요약 카드 그리드.
 * 이미 뽑힌 카테고리만 미니 카드로 노출하며, 각 카드는 해당 탭으로 이동한다.
 */
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import {
  FORTUNE_CATEGORIES,
  ROUTES,
  type FortuneCategoryId,
} from "@/lib/constants";

interface TodaySummaryProps {
  /** 카테고리 → 해당 카테고리의 오늘 운세 (없으면 null). */
  fortunes: Partial<Record<FortuneCategoryId, DailyFortune | null>>;
}

const CATEGORY_LABEL: Record<FortuneCategoryId, string> = Object.fromEntries(
  FORTUNE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<FortuneCategoryId, string>;

/** 종합 운 카드 아래에 노출할 보조 카테고리 순서. */
const SECONDARY_CATEGORIES: FortuneCategoryId[] = [
  "love",
  "money",
  "career",
  "health",
  "study",
];

export function TodaySummary({ fortunes }: TodaySummaryProps) {
  const items = SECONDARY_CATEGORIES.flatMap((id) => {
    const f = fortunes[id];
    if (!f) return [];
    return [{ id, fortune: f }];
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="font-mystic text-lg font-semibold tracking-tight">
        오늘 함께 본 운세
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ id, fortune }) => (
          <Link
            key={id}
            href={`${ROUTES.today}?category=${id}`}
            className="group block focus:outline-none"
          >
            <Card className="app-surface h-full transition group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-primary/40">
              <CardContent className="space-y-2 p-4">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABEL[id]}
                </span>
                <p className="font-mystic line-clamp-1 text-base font-semibold leading-snug">
                  {fortune.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  자세히 보기 →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
