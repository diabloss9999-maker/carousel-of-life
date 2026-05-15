"use client";

/**
 * 관측 실패 노트(Observation Failure Note).
 *
 * - 균열 수치가 높은 새벽에 드물게 한 줄을 표시한다.
 * - sessionStorage("obs_failure_shown") 로 세션당 1회 제한.
 * - pointer-events: none, aria-hidden.
 */
import { useEffect, useState } from "react";

import { loadFractureState } from "@/lib/fracture/fracture-state";
import {
  shouldFail,
  pickFailureLine,
} from "@/lib/systems/observation-failure";

const SESSION_KEY = "obs_failure_shown";
const MIN_DELAY_MS = 30_000;
const RANDOM_RANGE_MS = 60_000;
const REMOVE_MS = 3_500;

/** KST 기준 현재 시(0~23). */
function getKstHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
}

export function ObservationFailureNote() {
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
      const fracture = loadFractureState();
      const kstHour = getKstHour();
      if (!shouldFail({ fractureLevel: fracture.level, kstHour })) return;
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 */
      }
      setLine(pickFailureLine());
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
        top: "10vh",
        right: "6vw",
        zIndex: 8,
        pointerEvents: "none",
        fontSize: "15px",
        letterSpacing: "0.14em",
        color: "rgba(180,180,200,0.46)",
        fontFamily: "var(--font-serif)",
        animation: "fracture-whisper-in 3.5s ease-out forwards",
        maxWidth: "260px",
        textAlign: "right",
        lineHeight: 1.7,
        userSelect: "none",
      }}
    >
      {line}
    </div>
  );
}
