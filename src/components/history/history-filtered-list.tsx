"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Heart, Sparkles, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { HistoryItemCard } from "@/components/history/history-item-card";
import type { HistoryItem, HistoryKind } from "@/lib/history/service";
import { cn } from "@/lib/utils";

interface HistoryFilteredListProps {
  items: HistoryItem[];
}

type HistoryFilter = "all" | HistoryKind;
type DateFilter = "all" | "week" | "month";
const INITIAL_VISIBLE_COUNT = 10;

const FILTERS: Array<{
  icon: typeof Sun;
  key: HistoryFilter;
  labelKey: "filterAll" | "itemFortune" | "itemTarot" | "itemCompatShort";
}> = [
  { key: "all", labelKey: "filterAll", icon: Sparkles },
  { key: "fortune", labelKey: "itemFortune", icon: Sun },
  { key: "tarot", labelKey: "itemTarot", icon: Sparkles },
  { key: "compatibility", labelKey: "itemCompatShort", icon: Heart },
];

const DATE_FILTERS: Array<{
  key: DateFilter;
  labelKey: "periodAll" | "periodWeek" | "periodMonth";
}> = [
  { key: "all", labelKey: "periodAll" },
  { key: "week", labelKey: "periodWeek" },
  { key: "month", labelKey: "periodMonth" },
];

export function HistoryFilteredList({ items }: HistoryFilteredListProps) {
  const t = useTranslations("historyPage");
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [records, setRecords] = useState(items);
  const [now] = useState(() => Date.now());
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(
    () => ({
      all: records.length,
      fortune: records.filter((item) => item.kind === "fortune").length,
      tarot: records.filter((item) => item.kind === "tarot").length,
      compatibility: records.filter((item) => item.kind === "compatibility")
        .length,
    }),
    [records],
  );

  const visibleItems = useMemo(
    () => {
      const dayMs = 24 * 60 * 60 * 1000;
      return records.filter((item) => {
        if (filter !== "all" && item.kind !== filter) return false;
        if (dateFilter === "week") {
          return now - new Date(item.date).getTime() <= 7 * dayMs;
        }
        if (dateFilter === "month") {
          return now - new Date(item.date).getTime() <= 30 * dayMs;
        }
        return true;
      });
    },
    [dateFilter, filter, now, records],
  );
  const displayedItems = showAll
    ? visibleItems
    : visibleItems.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = Math.max(0, visibleItems.length - displayedItems.length);

  async function deleteRecord(item: HistoryItem) {
    const res = await fetch(`/api/history/${item.kind}/${item.data.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(t("deleteFailed"));
    }

    setRecords((current) =>
      current.filter(
        (record) =>
          record.kind !== item.kind || record.data.id !== item.data.id,
      ),
    );
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="font-mystic text-2xl font-semibold">
          {t("latestRecords")}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {t("showingRecent", { n: visibleItems.length })}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ icon: Icon, key, labelKey }) => {
          const selected = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setShowAll(false);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
              aria-pressed={selected}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span>{t(labelKey)}</span>
              <span className={selected ? "opacity-80" : "text-foreground/70"}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {t("periodLabel")}
        </span>
        {DATE_FILTERS.map(({ key, labelKey }) => {
          const selected = dateFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDateFilter(key);
                setShowAll(false);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
                selected
                  ? "border-primary/70 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
              aria-pressed={selected}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {visibleItems.length > 0 ? (
        <div className="space-y-3">
          {displayedItems.map((item) => (
            <HistoryItemCard
              key={`${item.kind}-${item.data.id}`}
              item={item}
              onDelete={deleteRecord}
            />
          ))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[14px] font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              기록 {hiddenCount}개 더 보기
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="app-surface rounded-2xl px-5 py-7 text-center">
          <p className="text-[15px] font-semibold">{t("filterEmptyTitle")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("filterEmptyBody")}
          </p>
        </div>
      )}
    </section>
  );
}
