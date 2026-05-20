"use client";

/**
 * 궁합 허브 — 5개의 탭을 한 화면에서 전환한다.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { BookHeart, CalendarDays, Heart, Sparkles, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TAB_IDS = ["new", "twoPerson", "zodiac", "chineseZodiac", "mbti"] as const;
export type CompatibilityTabId = (typeof TAB_IDS)[number];

interface CompatibilityHubProps {
  newReading: ReactNode;
  twoPerson: ReactNode;
  zodiac: ReactNode;
  chineseZodiac: ReactNode;
  mbti: ReactNode;
  defaultTab?: CompatibilityTabId;
}

export function CompatibilityHub({
  newReading,
  twoPerson,
  zodiac,
  chineseZodiac,
  mbti,
  defaultTab = "new",
}: CompatibilityHubProps) {
  const [active, setActive] = useState<CompatibilityTabId>(defaultTab);
  const t = useTranslations("compatibilityHub");

  const tabs = [
    { id: "new"           as CompatibilityTabId, label: t("tabMine"),       icon: Heart },
    { id: "twoPerson"     as CompatibilityTabId, label: t("tabTwoPerson"),  icon: UsersRound },
    { id: "zodiac"        as CompatibilityTabId, label: t("tabZodiac"),     icon: Sparkles },
    { id: "chineseZodiac" as CompatibilityTabId, label: t("tabChinese"),    icon: CalendarDays },
    { id: "mbti"          as CompatibilityTabId, label: t("tabMbti"),       icon: BookHeart },
  ];

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label={t("aria")}
        className="flex gap-1 overflow-x-auto rounded-full app-surface p-1 backdrop-blur"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[15px] font-medium transition-colors sm:px-3 sm:text-[15px]",
                selected
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {active === "new"           && newReading}
        {active === "twoPerson"     && twoPerson}
        {active === "zodiac"        && zodiac}
        {active === "chineseZodiac" && chineseZodiac}
        {active === "mbti"          && mbti}
      </div>
    </div>
  );
}
