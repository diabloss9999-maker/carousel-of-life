"use client";

/**
 * 카드 점술 탭 — 타로 / 르노르망 / 룬 등 여러 점술 시스템을 한 페이지에서 전환.
 *
 * URL 해시(#tarot, #lenormand, #runes) 로 초기 탭 결정 + hashchange 시 동기화.
 * 메뉴 드롭다운에서 /tarot#lenormand 같이 직접 진입 가능.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TAB_IDS = ["tarot", "lenormand", "runes"] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(v: string): v is TabId {
  return (TAB_IDS as readonly string[]).includes(v);
}

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
  const t = useTranslations("cardTabs");

  // 초기 해시 + 이후 hashchange 동기화.
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (isTabId(h)) setActive(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // 탭 변경 시 URL 해시도 업데이트 (뒤로가기 / 새로고침 시 보존).
  const select = (id: TabId) => {
    setActive(id);
    if (typeof window !== "undefined" && window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
  };

  const tabs: { id: TabId; label: string; desc: string }[] = [
    { id: "tarot",     label: t("tarot"),     desc: t("tarotDesc") },
    { id: "lenormand", label: t("lenormand"), desc: t("lenormandDesc") },
    { id: "runes",     label: t("rune"),      desc: t("runeDesc") },
  ];

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label={t("aria")}
        className="flex w-full gap-1 rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => select(tab.id)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center rounded-full px-3 py-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
              )}
            >
              <span className="text-[15px] font-medium whitespace-nowrap">{tab.label}</span>
              <span className={cn(
                "text-[15px] whitespace-nowrap leading-none mt-0.5",
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
