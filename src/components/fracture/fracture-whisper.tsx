"use client";

import { useEffect, useRef, useState } from "react";

import { useFractureSystem } from "@/hooks/use-fracture-system";
import { pickWhisper } from "@/lib/fracture/fracture-events";

interface WhisperMessage {
  id: number;
  text: string;
  /** 화면 좌측 기준 위치 (vw %). */
  x: number;
  /** 화면 상단 기준 위치 (vh %). */
  y: number;
}

/** Whisper 가 화면에 머무는 시간 (ms). */
const WHISPER_LIFETIME_MS = 1800;
/** 첫 진입 후 시도까지 기본 딜레이 범위. */
const MIN_INITIAL_DELAY_MS = 15_000;
const RANDOM_DELAY_RANGE_MS = 25_000;

/** 구석 위치 4 지점. */
const WHISPER_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 5, y: 10 },
  { x: 70, y: 8 },
  { x: 4, y: 80 },
  { x: 68, y: 82 },
];

let _id = 0;

/**
 * 화면 구석에 희미하게 나타났다 사라지는 문장.
 *
 * - 페이지 진입 후 15~40초 사이에 한 번 시도한다.
 * - 첫 스크롤 시 한 번 시도한다.
 * - 실제 출현 여부는 `tryTriggerEvent` 의 확률에 달려 있다.
 */
export function FractureWhisper() {
  const { state, isNight, tryTriggerEvent, updateState } = useFractureSystem();
  const [messages, setMessages] = useState<WhisperMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removalTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const removalTimers = removalTimersRef.current;
    function attempt() {
      tryTriggerEvent(() => {
        const text = pickWhisper(state);
        updateState((s) => ({ ...s, lastEventType: text }));

        const pos =
          WHISPER_POSITIONS[
            Math.floor(Math.random() * WHISPER_POSITIONS.length)
          ] ?? WHISPER_POSITIONS[0];

        const msg: WhisperMessage = {
          id: ++_id,
          text,
          x: pos.x,
          y: pos.y,
        };
        setMessages((prev) => [...prev, msg]);

        const removalTimer = setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          removalTimers.delete(removalTimer);
        }, WHISPER_LIFETIME_MS);
        removalTimers.add(removalTimer);
      });
    }

    const delay = MIN_INITIAL_DELAY_MS + Math.random() * RANDOM_DELAY_RANGE_MS;
    timerRef.current = setTimeout(attempt, delay);

    const onScroll = () => attempt();
    window.addEventListener("scroll", onScroll, { passive: true, once: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("scroll", onScroll);
      removalTimers.forEach((t) => clearTimeout(t));
      removalTimers.clear();
    };
    // 의도적으로 isNight 변화 시에만 재등록. state/tryTrigger 는 콜백 내부에서 최신값 사용.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNight]);

  if (messages.length === 0) return null;

  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          aria-hidden
          style={{
            position: "fixed",
            left: `${msg.x}vw`,
            top: `${msg.y}vh`,
            zIndex: 9,
            pointerEvents: "none",
            opacity: 0,
            fontSize: "12px",
            letterSpacing: "0.12em",
            color: isNight ? "rgba(246,239,220,0.28)" : "rgba(48,39,55,0.22)",
            fontFamily: "var(--font-serif)",
            animation: "fracture-whisper-in 1.8s ease-out forwards",
            maxWidth: "200px",
            lineHeight: 1.6,
            userSelect: "none",
          }}
        >
          {msg.text}
        </div>
      ))}
    </>
  );
}
