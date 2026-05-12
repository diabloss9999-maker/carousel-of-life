"use client";

/**
 * 오늘의 특별 문장(Daily Whisper).
 *
 * - 하루 1번, 페이지 진입 후 12~30초 사이에 한 번 잠깐 나타난다.
 * - sessionStorage 키로 중복 표시를 방지한다.
 * - pointer-events: none — 사용자 상호작용을 막지 않음.
 */
import { useEffect, useState } from "react";

import { useWorldProfile } from "@/hooks/use-world-profile";

const SESSION_KEY = "daily_whisper_shown";
const MIN_DELAY_MS = 12_000;
const RANDOM_RANGE_MS = 18_000;
const LIFETIME_MS = 2_200;

export function DailyWhisper() {
  const { todayWhisper } = useWorldProfile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY)) return;

    const showTimer = window.setTimeout(
      () => {
        setVisible(true);
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* 무시 */
        }
      },
      MIN_DELAY_MS + Math.random() * RANDOM_RANGE_MS,
    );

    return () => {
      window.clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const hideTimer = window.setTimeout(() => setVisible(false), LIFETIME_MS);
    return () => window.clearTimeout(hideTimer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        bottom: "18vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 8,
        pointerEvents: "none",
        opacity: 0,
        fontSize: "11px",
        letterSpacing: "0.14em",
        color: "var(--ritual-muted, rgba(48,39,55,0.30))",
        fontFamily: "var(--font-serif)",
        animation: "fracture-whisper-in 2.2s ease-out forwards",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {todayWhisper}
    </div>
  );
}
