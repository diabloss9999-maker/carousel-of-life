"use client";

/**
 * 카드 점술 탭 — 타로 / 르노르망 / 룬 등 여러 점술 시스템을 한 페이지에서 전환.
 */
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "tarot",     label: "타로",     desc: "78장 · 운명의 큰 흐름" },
  { id: "lenormand", label: "르노르망", desc: "36장 · 일상의 상황 읽기" },
  { id: "runes",     label: "룬",       desc: "24자 · 고대 문자의 계시" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  tarotPanel: ReactNode;
  lenormandPanel: ReactNode;
  runesPanel: ReactNode;
}

export function CardDivinationTabs({
  tarotPanel,
  lenormandPanel,
  runesPanel,
}: Props) {
  const [active, setActive] = useState<TabId>("tarot");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="카드 점술 종류"
        className="flex w-full gap-1 rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center rounded-full px-3 py-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
              <span className={cn(
                "text-[9px] whitespace-nowrap leading-none mt-0.5",
                isActive ? "text-primary-foreground/70" : "text-muted-foreground/50",
              )}>{tab.desc}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {active === "tarot"     ? tarotPanel     : null}
        {active === "lenormand" ? lenormandPanel  : null}
        {active === "runes"     ? runesPanel      : null}
      </div>
    </div>
  );
}
