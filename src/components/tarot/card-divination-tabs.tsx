"use client";

/**
 * 카드 점술 패널 스위처 — 타로 / 르노르망 / 룬.
 *
 * 메뉴바 드롭다운(/tarot#tarot, #lenormand, #runes) 으로 진입.
 * 탭 UI 는 제거됐고, URL 해시만 보고 해당 패널을 노출.
 * hashchange 이벤트로 라이브 동기화.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

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

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (isTabId(h)) setActive(h);
      else setActive("tarot"); // 해시 없으면 타로 기본
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div role="tabpanel" className="space-y-6">
      {active === "tarot"     ? tarotPanel     : null}
      {active === "lenormand" ? lenormandPanel : null}
      {active === "runes"     ? runesPanel     : null}
    </div>
  );
}
