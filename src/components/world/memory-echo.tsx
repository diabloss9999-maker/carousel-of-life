"use client";

/**
 * 장기 기억 메아리(Memory Echo).
 *
 * - 7일 이상 된 사용자 echo 중 무작위 1개를 키워드 기반 분위기 문장으로 표시.
 * - 페이지 진입 50~120초 후 50% 확률로 한 번만.
 * - sessionStorage("memory_echo_shown") 로 세션당 1회 제한.
 * - pointer-events: none, aria-hidden — 사용자 상호작용을 막지 않음.
 */
import { useEffect, useState } from "react";

import { pickAgedEcho, buildEchoLine } from "@/lib/systems/long-term-memory";

const SESSION_KEY = "memory_echo_shown";
const MIN_DELAY_MS = 50_000;
const RANDOM_RANGE_MS = 70_000;
const SHOW_PROBABILITY = 0.5;
const FADE_OUT_MS = 3_500;
const REMOVE_MS = 5_000;

export function MemoryEcho() {
  const [line, setLine] = useState<string | null>(null);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }

    const delay = MIN_DELAY_MS + Math.random() * RANDOM_RANGE_MS;
    let fadeTimer: number | undefined;
    let removeTimer: number | undefined;

    const showTimer = window.setTimeout(() => {
      if (Math.random() > SHOW_PROBABILITY) return;
      const echo = pickAgedEcho();
      if (!echo) return;
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 */
      }
      setLine(buildEchoLine(echo));
      fadeTimer = window.setTimeout(() => setFadingOut(true), FADE_OUT_MS);
      removeTimer = window.setTimeout(() => setLine(null), REMOVE_MS);
    }, delay);

    return () => {
      window.clearTimeout(showTimer);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
      if (removeTimer !== undefined) window.clearTimeout(removeTimer);
    };
  }, []);

  if (!line) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        bottom: "12vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 8,
        pointerEvents: "none",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 1.4s ease-out",
        fontSize: "12px",
        letterSpacing: "0.16em",
        color: "var(--ritual-muted, rgba(48,39,55,0.36))",
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        animation: "fracture-whisper-in 1.8s ease-out forwards",
        maxWidth: "min(86vw, 380px)",
        textAlign: "center",
        lineHeight: 1.7,
        userSelect: "none",
      }}
    >
      {line}
    </div>
  );
}
