"use client";

/**
 * 연속 방문 메시지 표시.
 *
 * - streak 일수가 3 이상일 때 한 번 잠깐 표시한다.
 * - sessionStorage 키로 streak 별 1회만 노출.
 */
import { useEffect, useState } from "react";

import { getContinuityNote } from "@/lib/systems/continuity";

interface ContinuityNoteProps {
  streakDays: number;
}

const SHOW_DELAY_MS = 5_000;
const LIFETIME_MS = 3_000;

export function ContinuityNote({ streakDays }: ContinuityNoteProps) {
  const [show, setShow] = useState(false);
  const note = getContinuityNote(streakDays);

  useEffect(() => {
    if (!note) return;
    if (typeof window === "undefined") return;

    const key = `continuity_shown_${streakDays}`;
    if (window.sessionStorage.getItem(key)) return;

    const showTimer = window.setTimeout(() => {
      setShow(true);
      try {
        window.sessionStorage.setItem(key, "1");
      } catch {
        /* 무시 */
      }
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(showTimer);
    };
  }, [note, streakDays]);

  useEffect(() => {
    if (!show) return;
    const hideTimer = window.setTimeout(() => setShow(false), LIFETIME_MS);
    return () => window.clearTimeout(hideTimer);
  }, [show]);

  if (!show || !note) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: "22vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 8,
        pointerEvents: "none",
        fontSize: "11px",
        letterSpacing: "0.12em",
        color: "var(--ritual-muted, rgba(48,39,55,0.35))",
        fontFamily: "var(--font-serif)",
        animation: "fracture-whisper-in 3s ease-out forwards",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {note}
    </div>
  );
}
