"use client";

/**
 * 세션 종료 페이드 — 탭 닫기 / 페이지 이탈 직전, 화면 위에 얇은 어둠과
 * 짧은 한 문장을 한 번만 띄운다.
 *
 * - 게임화 없음. 사용자 입력 방해 없음 (pointer-events: none, aria-hidden).
 * - 후유증 조건(긴 채팅 체류 / 새벽 / 균열 3+)에 해당하면 AFTERTASTE 문장이 우선.
 * - sessionStorage 키로 세션당 1회 제한.
 *
 * 자동 사라짐:
 *  - 표시 후 ~2.6초 뒤에 자동으로 페이드아웃 → 언마운트
 *  - 사용자가 탭으로 돌아오면(visibility=visible) 즉시 닫힘
 *  - 페이지 이탈이 실제 일어나면 새 페이지에서 새 mount 되니까 자연 초기화
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { loadFractureState } from "@/lib/fracture/fracture-state";

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
/** 페이드 표시 유지 시간 (이후 페이드아웃 시작). */
const VISIBLE_HOLD_MS = 2100;
/** 페이드아웃 애니메이션 시간 (CSS 와 동기화). */
const FADE_OUT_MS = 500;

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

  const entryRaw = window.sessionStorage.getItem(ENTRY_TIME_KEY);
  const entryAt = entryRaw ? parseInt(entryRaw, 10) || 0 : 0;
  const dwelled = entryAt > 0 ? Date.now() - entryAt : 0;
  const onChat = window.location.pathname.startsWith("/chat");
  if (onChat && dwelled >= LONG_DWELL_MS) return true;

  const h = getKstHour();
  if (h >= DAWN_HOUR_START && h < DAWN_HOUR_END) return true;

  try {
    const fracture = loadFractureState();
    if (fracture.level >= FRACTURE_THRESHOLD) return true;
  } catch {
    /* 무시 */
  }
  return false;
}

function pickOne(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
}

export function SessionFade() {
  const [closing, setClosing] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [line, setLine] = useState("");
  const tWorld = useTranslations("worldAtmosphere");
  /** 진행 중인 타이머 핸들 모음 — cleanup 에서 한 번에 정리. */
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timers = timersRef.current;

    try {
      if (!window.sessionStorage.getItem(ENTRY_TIME_KEY)) {
        window.sessionStorage.setItem(ENTRY_TIME_KEY, String(Date.now()));
      }
    } catch {
      /* 무시 */
    }

    /** 즉시 닫기 — 탭 복귀 시 / 새 mount 시 / 안전 fallback. */
    const closeImmediately = (): void => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
      setFadingOut(false);
      setClosing(false);
    };

    /** 부드러운 페이드아웃 후 언마운트. */
    const scheduleAutoHide = (): void => {
      const t1 = setTimeout(() => {
        setFadingOut(true);
        const t2 = setTimeout(() => {
          setFadingOut(false);
          setClosing(false);
          timers.delete(t2);
        }, FADE_OUT_MS);
        timers.add(t2);
        timers.delete(t1);
      }, VISIBLE_HOLD_MS);
      timers.add(t1);
    };

    /** 종료 직전 트리거. */
    const handler = (): void => {
      try {
        if (window.sessionStorage.getItem(SESSION_KEY)) return;
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* 무시 — 그래도 한 번은 보여줌 */
      }

      const aftertaste = shouldUseAftertaste();
      const pool = (aftertaste
        ? tWorld.raw("sessionAftertasteFull")
        : tWorld.raw("sessionClosing")) as readonly string[];
      setLine(pickOne(pool));
      setFadingOut(false);
      setClosing(true);
      // 일정 시간 후 자동으로 사라지도록 예약.
      scheduleAutoHide();
    };

    const onVisibility = (): void => {
      if (document.visibilityState === "hidden") {
        handler();
      } else {
        // 사용자가 돌아오면 즉시 닫기.
        closeImmediately();
      }
    };

    window.addEventListener("beforeunload", handler);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", handler);

    return () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", handler);
    };
  }, [tWorld]);

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
        opacity: fadingOut ? 0 : 1,
        animation: fadingOut
          ? undefined
          : "session-fade-in 0.45s ease-out forwards",
        transition: `opacity ${FADE_OUT_MS}ms ease-in`,
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
