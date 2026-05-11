"use client";

/**
 * 궁합 허브 — 5개의 탭을 한 화면에서 전환한다.
 *  1) 나의 궁합 (나 + 상대)
 *  2) 타인 간 궁합 (제3자 두 명)
 *  3) 별자리 궁합
 *  4) 띠 궁합
 *  5) 성격유형 궁합
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { BookHeart, CalendarDays, Heart, Sparkles, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

const TAB_DEFS = [
  { id: "new",           label: "나의 궁합",    icon: Heart },
  { id: "twoPerson",     label: "타인 간 궁합", icon: UsersRound },
  { id: "zodiac",        label: "별자리 궁합",  icon: Sparkles },
  { id: "chineseZodiac", label: "띠 궁합",      icon: CalendarDays },
  { id: "mbti",          label: "성격유형 궁합", icon: BookHeart },
] as const;

export type CompatibilityTabId = (typeof TAB_DEFS)[number]["id"];

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

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="궁합 탭"
        className="flex gap-1 overflow-x-auto rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur"
      >
        {TAB_DEFS.map((tab) => {
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
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
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
