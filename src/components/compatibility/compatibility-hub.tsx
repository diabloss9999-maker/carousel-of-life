"use client";

/**
 * 궁합 허브 — 4개의 탭을 한 화면에서 전환한다.
 *  1) 저장된 상대
 *  2) 새 궁합 보기
 *  3) 별자리 궁합
 *  4) MBTI 궁합
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { BookHeart, Heart, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const TAB_DEFS = [
  { id: "saved", label: "저장된 상대", icon: Users },
  { id: "new", label: "새 궁합", icon: Heart },
  { id: "zodiac", label: "별자리 궁합", icon: Sparkles },
  { id: "mbti", label: "MBTI 궁합", icon: BookHeart },
] as const;

export type CompatibilityTabId = (typeof TAB_DEFS)[number]["id"];

interface CompatibilityHubProps {
  saved: ReactNode;
  newReading: ReactNode;
  zodiac: ReactNode;
  mbti: ReactNode;
  defaultTab?: CompatibilityTabId;
}

export function CompatibilityHub({
  saved,
  newReading,
  zodiac,
  mbti,
  defaultTab = "saved",
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
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                selected
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {active === "saved" && saved}
        {active === "new" && newReading}
        {active === "zodiac" && zodiac}
        {active === "mbti" && mbti}
      </div>
    </div>
  );
}
