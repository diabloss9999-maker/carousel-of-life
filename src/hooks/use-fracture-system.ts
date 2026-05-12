"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  loadFractureState,
  saveFractureState,
  recordVisit,
  getSessionEventCount,
  incrementSessionEventCount,
  type FractureState,
} from "@/lib/fracture/fracture-state";
import { getFractureChance } from "@/lib/fracture/fracture-events";

/** 세션당 균열 이벤트 최대 발생 횟수. */
const MAX_SESSION_EVENTS = 2;
/** 밤 시간대 — KST 19시 ~ 익일 06시 59분. */
const NIGHT_HOUR_START = 19;
const NIGHT_HOUR_END = 7;
/** 낮/밤 폴링 주기 (ms). */
const TIME_POLL_INTERVAL_MS = 60_000;

/** 한국 시간 기준 현재 시각이 밤인지 판단한다. */
function getIsNight(): boolean {
  try {
    const seoul = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    );
    const h = seoul.getHours();
    return h >= NIGHT_HOUR_START || h < NIGHT_HOUR_END;
  } catch {
    return false;
  }
}

export interface FractureContext {
  /** 현재 균열 상태 (localStorage 동기화). */
  state: FractureState;
  /** 밤 시간대 여부. */
  isNight: boolean;
  /** 확률 기반 이벤트 트리거. 발생하면 true 반환. */
  tryTriggerEvent: (callback: () => void) => boolean;
  /** 상태 업데이터. */
  updateState: (updater: (s: FractureState) => FractureState) => void;
}

/**
 * 균열 연출 시스템 진입점 훅.
 *
 * - 컴포넌트 마운트 시 방문을 기록한다.
 * - 1분 간격으로 낮/밤 전환을 감지한다.
 * - 밤 시간대에는 documentElement 에 `night` 클래스를 추가한다.
 */
export function useFractureSystem(): FractureContext {
  const [state, setState] = useState<FractureState>(() => loadFractureState());
  const [isNight, setIsNight] = useState<boolean>(() => getIsNight());
  const visitedRef = useRef(false);

  // 방문 기록은 마운트 시 한 번만, 낮/밤 폴링 등록.
  useEffect(() => {
    if (!visitedRef.current) {
      visitedRef.current = true;
      const night = getIsNight();
      setIsNight(night);

      setState((prev) => {
        const next = recordVisit(prev, night);
        saveFractureState(next);
        return next;
      });
    }

    const timer = window.setInterval(() => {
      setIsNight(getIsNight());
    }, TIME_POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  // night 클래스를 documentElement 에 동기화한다.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isNight) {
      root.classList.add("night");
    } else {
      root.classList.remove("night");
    }
  }, [isNight]);

  const updateState = useCallback(
    (updater: (s: FractureState) => FractureState) => {
      setState((prev) => {
        const next = updater(prev);
        saveFractureState(next);
        return next;
      });
    },
    [],
  );

  const tryTriggerEvent = useCallback(
    (callback: () => void): boolean => {
      if (getSessionEventCount() >= MAX_SESSION_EVENTS) return false;
      const chance = getFractureChance(state, isNight);
      if (Math.random() > chance) return false;
      incrementSessionEventCount();
      callback();
      return true;
    },
    [state, isNight],
  );

  return { state, isNight, tryTriggerEvent, updateState };
}
