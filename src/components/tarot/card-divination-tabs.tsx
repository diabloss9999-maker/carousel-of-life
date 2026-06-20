"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const TAB_IDS = ["tarot"] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(v: string): v is TabId {
  return (TAB_IDS as readonly string[]).includes(v);
}

interface Props {
  tarotPanel: ReactNode;
}

export function CardDivinationTabs({ tarotPanel }: Props) {
  const [active, setActive] = useState<TabId>("tarot");

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (isTabId(h)) setActive(h);
      else setActive("tarot");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div role="tabpanel" className="space-y-6">
      {active === "tarot" ? tarotPanel : null}
    </div>
  );
}
