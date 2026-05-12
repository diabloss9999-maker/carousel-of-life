"use client";

/**
 * 숨겨진 존재 — 화면 중앙에 한 줄 + 희미한 카드 이미지, 매우 낮은 확률로 등장.
 *
 * - 기본 확률 0.2% / 균열 4+ 시 0.5%.
 * - 세션당 최대 1회 (sessionStorage).
 * - 4.5초간 머무른 뒤 사라진다.
 * - 공포 아니라 "기록되지 않은 흔적"의 느낌.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { loadFractureState } from "@/lib/fracture/fracture-state";
import { pickHiddenEntity, type HiddenEntity } from "@/lib/systems/hidden-entities";

const SESSION_KEY = "hidden_presence_shown";
const MIN_DELAY_MS = 40_000;
const RANDOM_RANGE_MS = 80_000;
const LIFETIME_MS = 4_500;
const FADE_OUT_MS = 1_400;

const BASE_CHANCE = 0.002;
const HIGH_FRACTURE_CHANCE = 0.005;
const FRACTURE_THRESHOLD = 4;

function getKstHour(): number {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).getHours();
}

export function HiddenPresence() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [entity, setEntity] = useState<HiddenEntity | null>(null);
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
      let fractureLevel = 0;
      try {
        const fracture = loadFractureState();
        fractureLevel = fracture.level;
        if (fractureLevel >= FRACTURE_THRESHOLD) chance = HIGH_FRACTURE_CHANCE;
      } catch {
        /* 무시 */
      }
      if (Math.random() > chance) return;

      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 */
      }

      const hour = getKstHour();
      const isDawn = hour >= 2 && hour < 5;
      const isNight = hour >= 19 || hour < 7;
      const picked = pickHiddenEntity({ fractureLevel, isDawn, isNight });

      setEntity(picked);
      setVisible(true);

      addTimer(() => setFadingOut(true), LIFETIME_MS);
      addTimer(() => {
        setVisible(false);
        setFadingOut(false);
        setEntity(null);
      }, LIFETIME_MS + FADE_OUT_MS);
    }, delay);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  if (!visible || !entity) return null;

  return (
    <>
      {/* 배경 어둡게 — pointer-events none */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8,7,16,0.22)",
          zIndex: 9,
          pointerEvents: "none",
          opacity: fadingOut ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        }}
      />
      {/* 카드 + 문장 — 중앙 */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          opacity: fadingOut ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease-out`,
          animation: "session-fade-in 1.2s ease-out forwards",
          userSelect: "none",
        }}
      >
        {/* 희미한 카드 이미지 — 모바일은 viewport 비율, 데스크톱은 최대 360px */}
        <div
          style={{
            position: "relative",
            width: "min(360px, 75vw)",
            aspectRatio: "2 / 3",
            opacity: 0.78,
            filter: "blur(0.3px) brightness(0.94)",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.48), inset 0 0 40px rgba(0,0,0,0.32)",
          }}
        >
          <Image
            src={entity.imageSrc}
            alt=""
            fill
            sizes="(max-width: 480px) 75vw, 360px"
            style={{ objectFit: "cover" }}
            aria-hidden
          />
          {/* 카드 위 그라디언트 베일 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at center, transparent 30%, rgba(8,7,16,0.55) 100%)",
            }}
          />
        </div>
        {/* 한 줄 문장 */}
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "15px",
            letterSpacing: "0.18em",
            color: "rgba(220,200,210,0.72)",
            textAlign: "center",
            maxWidth: "min(86vw, 520px)",
            lineHeight: 1.7,
            margin: 0,
            textShadow: "0 0 12px rgba(0,0,0,0.5)",
          }}
        >
          {entity.line}
        </p>
        {/* ??? 처리된 이름 — 거의 안 보일 정도로 */}
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "12px",
            letterSpacing: "0.34em",
            color: "rgba(180,160,180,0.32)",
            margin: 0,
          }}
        >
          ???
        </p>
      </div>
    </>
  );
}
