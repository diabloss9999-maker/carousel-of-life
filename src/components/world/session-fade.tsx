"use client";

/**
 * 세션 종료 페이드 — 탭 닫기 / 페이지 이탈 직전, 화면 위에 얇은 어둠과
 * 짧은 한 문장을 한 번만 띄운다.
 *
 * - 게임화 없음. 사용자 입력 방해 없음 (pointer-events: none, aria-hidden).
 * - 후유증 조건(긴 채팅 체류 / 새벽 / 균열 3+)에 해당하면 AFTERTASTE 문장이 우선.
 * - sessionStorage 키로 세션당 1회 제한.
 */
import { useEffect, useState } from "react";

import { loadFractureState } from "@/lib/fracture/fracture-state";

/** 일반 종료 시 후보 문장. */
const CLOSING_LINES: readonly string[] = [
  "오늘의 관측이 조용히 봉인되었습니다.",
  "루나는 아직 문장을 정리하고 있습니다.",
  "오늘 남겨진 흔적은 쉽게 사라지지 않습니다.",
  "기록이 천천히 닫히고 있습니다.",
  "오늘의 빛은 조금 늦게 꺼졌습니다.",
] as const;

/** 후유증 조건 충족 시의 우선 문장. */
const AFTERTASTE_LINES: readonly string[] = [
  "오늘의 기록은 아직 완전히 닫히지 않았습니다.",
  "루나는 당신의 마지막 문장을 오래 바라보았습니다.",
  "같은 흐름은 쉽게 사라지지 않습니다.",
  "이 문장은 오늘만 남는 문장입니다.",
] as const;

/** 세션 1회 제한 키. */
const SESSION_KEY = "session_fade_shown";
/** 페이지 진입 시각 키 (sessionStorage). */
const ENTRY_TIME_KEY = "session_entry_at";
/** 후유증 트리거 — 5분 이상 체류. */
const LONG_DWELL_MS = 5 * 60 * 1000;
/** 후유증 트리거 — 균열 임계. */
const FRACTURE_THRESHOLD = 3;
/** 새벽 시작/끝 (KST). */
const DAWN_HOUR_START = 2;
const DAWN_HOUR_END = 5;

/** KST 기준 현재 시(0~23). */
function getKstHour(): number {
  try {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    ).getHours();
  } catch {
    return new Date().getHours();
  }
}

/** 후유증 조건 충족 여부. */
function shouldUseAftertaste(): boolean {
  if (typeof window === "undefined") return false;

  // 1) 채팅 페이지에서 5분 이상 체류
  const entryRaw = window.sessionStorage.getItem(ENTRY_TIME_KEY);
  const entryAt = entryRaw ? parseInt(entryRaw, 10) || 0 : 0;
  const dwelled = entryAt > 0 ? Date.now() - entryAt : 0;
  const onChat = window.location.pathname.startsWith("/chat");
  if (onChat && dwelled >= LONG_DWELL_MS) return true;

  // 2) 새벽 시간대
  const h = getKstHour();
  if (h >= DAWN_HOUR_START && h < DAWN_HOUR_END) return true;

  // 3) 균열 임계 이상
  try {
    const fracture = loadFractureState();
    if (fracture.level >= FRACTURE_THRESHOLD) return true;
  } catch {
    /* 무시 */
  }
  return false;
}

/** 후보 배열 중 하나를 무작위 선택. */
function pickOne(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
}

export function SessionFade() {
  const [closing, setClosing] = useState(false);
  const [line, setLine] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 페이지 진입 시각 기록 (없는 경우만)
    try {
      if (!window.sessionStorage.getItem(ENTRY_TIME_KEY)) {
        window.sessionStorage.setItem(ENTRY_TIME_KEY, String(Date.now()));
      }
    } catch {
      /* 무시 */
    }

    /** 종료 직전 트리거. */
    const handler = (): void => {
      try {
        if (window.sessionStorage.getItem(SESSION_KEY)) return;
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 — 그래도 한 번은 보여줌 */
      }

      const pool = shouldUseAftertaste() ? AFTERTASTE_LINES : CLOSING_LINES;
      setLine(pickOne(pool));
      setClosing(true);
    };

    const onVisibility = (): void => {
      if (document.visibilityState === "hidden") handler();
    };

    window.addEventListener("beforeunload", handler);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", handler);
    };
  }, []);

  if (!closing) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,7,16,0.32)",
        backdropFilter: "blur(0.6px)",
        WebkitBackdropFilter: "blur(0.6px)",
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "session-fade-in 0.45s ease-out forwards",
      }}
    >
      <p
        style={{
          color: "rgba(246,239,220,0.62)",
          fontFamily: "var(--font-serif)",
          fontSize: "13px",
          letterSpacing: "0.12em",
          textAlign: "center",
          padding: "0 24px",
          margin: 0,
        }}
      >
        {line}
      </p>
    </div>
  );
}
