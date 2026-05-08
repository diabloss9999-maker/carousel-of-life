import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HistoryItemCard } from "@/components/history/history-item-card";
import { ROUTES } from "@/lib/constants";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getHistory,
  getHistoryCounts,
  type HistoryItem,
} from "@/lib/history/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "기록",
  description: "지난 운세·타로·궁합 풀이를 한 곳에서 돌아볼 수 있어요.",
};

type FilterKind = "all" | "fortune" | "tarot" | "compatibility";

const VALID_FILTERS = new Set<FilterKind>([
  "all",
  "fortune",
  "tarot",
  "compatibility",
]);

interface HistoryPageProps {
  searchParams: Promise<{ kind?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const { kind: rawKind } = await searchParams;
  if (rawKind && !VALID_FILTERS.has(rawKind as FilterKind)) {
    redirect(ROUTES.history as Route);
  }
  const filter: FilterKind = (rawKind as FilterKind | undefined) ?? "all";

  const { profile } = await requireProfile();
  const [items, counts] = await Promise.all([
    getHistory(profile.userId),
    getHistoryCounts(profile.userId),
  ]);

  const filtered: HistoryItem[] =
    filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          기록
        </h1>
        <p className="text-muted-foreground">
          지난 풀이를 한 곳에서 돌아볼 수 있어. 총 {counts.total}건이 모였어.
        </p>
      </header>

      {/* 탭 */}
      <nav
        aria-label="기록 필터"
        className="flex flex-wrap gap-2 border-b border-border/40 pb-2"
      >
        <FilterTab
          href={ROUTES.history as Route}
          label="전체"
          count={counts.total}
          active={filter === "all"}
        />
        <FilterTab
          href={`${ROUTES.history}?kind=fortune` as Route}
          label="운세"
          count={counts.fortune}
          active={filter === "fortune"}
        />
        <FilterTab
          href={`${ROUTES.history}?kind=tarot` as Route}
          label="타로"
          count={counts.tarot}
          active={filter === "tarot"}
        />
        <FilterTab
          href={`${ROUTES.history}?kind=compatibility` as Route}
          label="궁합"
          count={counts.compatibility}
          active={filter === "compatibility"}
        />
      </nav>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const id =
              item.kind === "fortune"
                ? `f-${item.data.id}`
                : item.kind === "tarot"
                  ? `t-${item.data.id}`
                  : `c-${item.data.id}`;
            return <HistoryItemCard key={id} item={item} />;
          })}
        </div>
      ) : (
        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <Archive className="h-5 w-5 text-muted-foreground" aria-hidden />
              아직 모인 기록이 없어
            </CardTitle>
            <CardDescription>
              운세·타로·궁합 풀이를 받으면 여기에 차곡차곡 쌓여.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}

function FilterTab({
  href,
  label,
  count,
  active,
}: {
  href: Route;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span>{label}</span>
      <span className="text-xs tabular-nums opacity-70">{count}</span>
    </Link>
  );
}
