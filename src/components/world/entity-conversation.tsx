"use client";

/**
 * 존재끼리의 짧은 대화 — 화면 모서리에 한 줄씩 떠올랐다 사라진다.
 *
 * - 세션당 최대 1회 (sessionStorage).
 * - 기본 확률 1.5% / 균열 임계 이상이면 3%.
 * - 어떤 대화가 선택되는지는 dailySeed 로 결정 (같은 날에는 사용자별로 같은 흐름).
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { loadFractureState } from "@/lib/fracture/fracture-state";
import { getDailySeed, seedValue } from "@/lib/systems/daily-seed";

interface ConversationLine {
  who: string;
  line: string;
}

/** 모서리 위치 후보. */
const POSITIONS: ReadonlyArray<{ top?: string; bottom?: string; left?: string; right?: string }> = [
  { top: "10vh", right: "5vw" },
  { bottom: "14vh", left: "5vw" },
];

const SESSION_KEY = "entity_conversation_shown";
const MIN_INITIAL_DELAY_MS = 25_000;
const RANDOM_DELAY_RANGE_MS = 35_000;
const LINE_INTERVAL_MS = 1_200;
const HOLD_AFTER_LAST_MS = 3_000;
const FADE_OUT_MS = 1_400;

/** 기본 등장 확률. */
const BASE_CHANCE = 0.015;
/** 균열 임계 이상에서의 등장 확률. */
const HIGH_FRACTURE_CHANCE = 0.03;
/** 균열 임계 (level). */
const FRACTURE_THRESHOLD = 30;

interface DisplayLine extends ConversationLine {
  id: number;
}

let _id = 0;

export function EntityConversation() {
  const [lines, setLines] = useState<DisplayLine[]>([]);
  const [position, setPosition] = useState<(typeof POSITIONS)[number] | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const tWorld = useTranslations("worldAtmosphere");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }

    const timers = timersRef.current;

    /** 타이머 등록 헬퍼. */
    const addTimer = (cb: () => void, ms: number): void => {
      const t = setTimeout(() => {
        timers.delete(t);
        cb();
      }, ms);
      timers.add(t);
    };

    const delay = MIN_INITIAL_DELAY_MS + Math.random() * RANDOM_DELAY_RANGE_MS;

    addTimer(() => {
      // 등장 확률 체크
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

      // 대화 / 위치 선택 (seed 기반) — i18n 에서 대화 배열 로드
      const conversations = tWorld.raw("entityDialogs") as ReadonlyArray<ReadonlyArray<ConversationLine>>;
      if (!conversations || conversations.length === 0) return;
      const seed = getDailySeed();
      const convIdx = Math.floor(seedValue(seed, 200) * conversations.length);
      const conv = conversations[convIdx] ?? conversations[0];
      if (!conv) return;

      const posIdx = Math.floor(seedValue(seed, 201) * POSITIONS.length);
      setPosition(POSITIONS[posIdx] ?? POSITIONS[0] ?? null);

      // 줄별로 1.2초 간격 표시
      conv.forEach((entry, idx) => {
        addTimer(() => {
          setLines((prev) => [...prev, { id: ++_id, ...entry }]);
        }, idx * LINE_INTERVAL_MS);
      });

      // 마지막 줄 표시 후 hold → fade out
      const totalShowMs = conv.length * LINE_INTERVAL_MS + HOLD_AFTER_LAST_MS;
      addTimer(() => setFadingOut(true), totalShowMs);
      addTimer(() => {
        setLines([]);
        setFadingOut(false);
        setPosition(null);
      }, totalShowMs + FADE_OUT_MS);
    }, delay);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [tWorld]);

  if (lines.length === 0 || !position) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        ...position,
        zIndex: 8,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        maxWidth: "min(80vw, 320px)",
        opacity: fadingOut ? 0 : 0.36,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        userSelect: "none",
      }}
    >
      {lines.map((entry) => (
        <p
          key={entry.id}
          style={{
            margin: 0,
            fontFamily: "var(--font-serif)",
            fontSize: "15px",
            letterSpacing: "0.10em",
            color: "var(--ritual-muted, rgba(48,39,55,0.55))",
            lineHeight: 1.7,
            animation: "session-fade-in 0.8s ease-out forwards",
          }}
        >
          <span style={{ opacity: 0.72, marginRight: 6 }}>{entry.who} —</span>
          {entry.line}
        </p>
      ))}
    </div>
  );
}
