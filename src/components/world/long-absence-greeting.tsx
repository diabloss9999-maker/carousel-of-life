"use client";

/**
 * 오랜만 접속 인사 — 페이지 진입 8초 뒤 화면 중앙 위쪽에 3초간 표시.
 *
 * - sessionStorage 키로 세션당 1회 제한.
 * - 입력 방해 없음 (pointer-events: none, aria-hidden).
 */
import { useEffect, useRef, useState } from "react";

import { loadEntityMemory } from "@/lib/entity/entity-memory";
import { getLongAbsenceGreeting } from "@/lib/systems/long-absence";

const SESSION_KEY = "long_absence_shown";
const SHOW_DELAY_MS = 8_000;
const LIFETIME_MS = 3_000;

export function LongAbsenceGreeting() {
  const [visible, setVisible] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }

    // useEntityMemory 훅은 마운트 시 lastVisitAt 을 "현재 시각" 으로
    // 갱신해 버리므로, 이 컴포넌트는 직접 localStorage 를 읽어
    // **갱신 전** 마지막 방문 시각을 얻는다.
    const memory = loadEntityMemory();
    const greeting = getLongAbsenceGreeting(memory.lastVisitAt);
    if (!greeting) return;

    const showTimer = setTimeout(() => {
      setLine(greeting);
      setVisible(true);
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 */
      }
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, LIFETIME_MS);
    }, SHOW_DELAY_MS);

    return () => {
      clearTimeout(showTimer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!visible || !line) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: "14vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9,
        pointerEvents: "none",
        opacity: 0,
        fontSize: "11.5px",
        letterSpacing: "0.14em",
        color: "var(--ritual-muted, rgba(48,39,55,0.35))",
        fontFamily: "var(--font-serif)",
        animation: "fracture-whisper-in 3s ease-out forwards",
        maxWidth: "min(86vw, 420px)",
        textAlign: "center",
        lineHeight: 1.7,
        userSelect: "none",
      }}
    >
      {line}
    </div>
  );
}
