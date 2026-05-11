"use client";

/**
 * 카드 점술 탭 — 타로 / 르노르망 / 룬 등 여러 점술 시스템을 한 페이지에서 전환.
 *
 * 추후 오라클 등 새로운 시스템을 추가하기 쉽도록 설계.
 */
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "tarot", label: "🃏 타로" },
  { id: "lenormand", label: "🌙 르노르망" },
  { id: "runes", label: "ᚠ 룬" },
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
        className="flex w-fit gap-1 rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur"
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
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {active === "tarot" ? tarotPanel : null}
        {active === "lenormand" ? lenormandPanel : null}
        {active === "runes" ? runesPanel : null}
      </div>
    </div>
  );
}
