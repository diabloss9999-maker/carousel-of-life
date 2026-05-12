"use client";

/**
 * 숨겨진 존재 — 화면 중앙에 한 줄, 매우 낮은 확률로 등장.
 *
 * - 기본 확률 0.2% / 균열 4+ 시 0.5%.
 * - 세션당 최대 1회 (sessionStorage).
 * - 4초간 머무른 뒤 사라진다.
 * - 공포 아니라 "기록되지 않은 흔적"의 느낌.
 */
import { useEffect, useRef, useState } from "react";

import { loadFractureState } from "@/lib/fracture/fracture-state";

const HIDDEN_LINES: readonly string[] = [
  "기록되지 않은 존재가 개입했습니다.",
  "누군가 먼저 이 문장을 읽고 있었습니다.",
  "이 응답은 원래 남겨질 예정이 아니었습니다.",
  "이름이 지워진 자국이 남았습니다.",
] as const;

const SESSION_KEY = "hidden_presence_shown";
const MIN_DELAY_MS = 40_000;
const RANDOM_RANGE_MS = 80_000;
const LIFETIME_MS = 4_000;
const FADE_OUT_MS = 1_200;

const BASE_CHANCE = 0.002;
const HIGH_FRACTURE_CHANCE = 0.005;
const FRACTURE_THRESHOLD = 4;

/** 후보 중 하나 선택. */
function pickLine(): string {
  return (
    HIDDEN_LINES[Math.floor(Math.random() * HIDDEN_LINES.length)] ??
    HIDDEN_LINES[0] ??
    ""
  );
}

export function HiddenPresence() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }

    const timers = timersRef.current;
    const addTimer = (cb: () => void, ms: number): void => {
      const t = setTimeout(() => {
        timers.delete(t);
        cb();
      }, ms);
      timers.add(t);
    };

    const delay = MIN_DELAY_MS + Math.random() * RANDOM_RANGE_MS;
    addTimer(() => {
      let chance = BASE_CHANCE;
      try {
        const fracture = loadFractureState();
        if (fracture.level >= FRACTURE_THRESHOLD) chance = HIGH_FRACTURE_CHANCE;
      } catch {
        /* 무시 */
      }
      if (Math.random() > chance) return;

      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 */
      }

      setLine(pickLine());
      setVisible(true);

      addTimer(() => setFadingOut(true), LIFETIME_MS);
      addTimer(() => {
        setVisible(false);
        setFadingOut(false);
        setLine(null);
      }, LIFETIME_MS + FADE_OUT_MS);
    }, delay);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  if (!visible || !line) return null;

  return (
    <>
      {/* 살짝 어두워지는 배경 — pointer-events none */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8,7,16,0.18)",
          zIndex: 9,
          pointerEvents: "none",
          opacity: fadingOut ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none",
          opacity: fadingOut ? 0 : 0.92,
          transition: `opacity ${FADE_OUT_MS}ms ease-out`,
          fontFamily: "var(--font-serif)",
          fontSize: "12.5px",
          letterSpacing: "0.16em",
          color: "rgba(180,160,180,0.42)",
          textAlign: "center",
          padding: "0 24px",
          maxWidth: "min(86vw, 460px)",
          lineHeight: 1.7,
          animation: "session-fade-in 0.9s ease-out forwards",
          userSelect: "none",
        }}
      >
        {line}
      </div>
    </>
  );
}
