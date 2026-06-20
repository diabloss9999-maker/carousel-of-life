"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  BookHeart,
  CalendarDays,
  Heart,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type CompatibilityTabId =
  | "new"
  | "twoPerson"
  | "zodiac"
  | "chineseZodiac"
  | "mbti";

interface CompatibilityTab {
  id: CompatibilityTabId;
  label: string;
  icon: LucideIcon;
}

interface CompatibilityHubProps {
  newReading: ReactNode;
  twoPerson: ReactNode;
  zodiac: ReactNode;
  chineseZodiac: ReactNode;
  mbti: ReactNode;
  defaultTab?: CompatibilityTabId;
}

const TABS: CompatibilityTab[] = [
  { id: "new", label: "새 궁합", icon: Heart },
  { id: "twoPerson", label: "두 사람", icon: UsersRound },
  { id: "zodiac", label: "별자리", icon: Sparkles },
  { id: "chineseZodiac", label: "띠궁합", icon: CalendarDays },
  { id: "mbti", label: "MBTI", icon: BookHeart },
];

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
        aria-label="궁합 보기 방식"
        className="flex gap-1 overflow-x-auto rounded-full app-surface p-1 backdrop-blur"
      >
        {TABS.map((tab) => {
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
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[15px] font-medium transition-colors sm:px-3",
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
        {active === "new" && newReading}
        {active === "twoPerson" && twoPerson}
        {active === "zodiac" && zodiac}
        {active === "chineseZodiac" && chineseZodiac}
        {active === "mbti" && mbti}
      </div>
    </div>
  );
}
