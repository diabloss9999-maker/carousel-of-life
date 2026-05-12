"use client";

/**
 * 존재 간 견제(Entity Interference).
 *
 * - 한 존재가 압도적일 때 다른 존재가 미세하게 끼어드는 한 줄.
 * - sessionStorage("entity_interference_shown") 로 세션당 1회 제한.
 * - 70~160초 사이, 추가로 30% 확률만 발현.
 * - pointer-events: none, aria-hidden.
 */
import { useEffect, useState } from "react";

import { loadEntityMemory } from "@/lib/entity/entity-memory";
import { loadFractureState } from "@/lib/fracture/fracture-state";
import { computeEntityRelation } from "@/lib/systems/entity-relations";

const SESSION_KEY = "entity_interference_shown";
const MIN_DELAY_MS = 70_000;
const RANDOM_RANGE_MS = 90_000;
const SHOW_PROBABILITY = 0.3;
const REMOVE_MS = 4_000;

export function EntityInterference() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }

    const delay = MIN_DELAY_MS + Math.random() * RANDOM_RANGE_MS;
    let removeTimer: number | undefined;

    const t = window.setTimeout(() => {
      const relation = computeEntityRelation(
        loadEntityMemory(),
        loadFractureState(),
      );
      if (!relation.jealousyNote) return;
      if (Math.random() > SHOW_PROBABILITY) return;
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 */
      }
      setLine(relation.jealousyNote);
      removeTimer = window.setTimeout(() => setLine(null), REMOVE_MS);
    }, delay);

    return () => {
      window.clearTimeout(t);
      if (removeTimer !== undefined) window.clearTimeout(removeTimer);
    };
  }, []);

  if (!line) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        bottom: "20vh",
        right: "5vw",
        zIndex: 8,
        pointerEvents: "none",
        fontSize: "11.5px",
        letterSpacing: "0.14em",
        color: "rgba(200,180,220,0.48)",
        fontFamily: "var(--font-serif)",
        animation: "fracture-whisper-in 4s ease-out forwards",
        maxWidth: "280px",
        textAlign: "right",
        lineHeight: 1.7,
        userSelect: "none",
      }}
    >
      {line}
    </div>
  );
}
