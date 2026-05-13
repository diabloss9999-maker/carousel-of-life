"use client";

/**
 * 배경 BGM — 시간대에 따라 두 트랙을 자동 교차 재생.
 *
 * - 낮 트랙 (`day-loop.mp3`): KST 04:00 ~ 23:59 재생
 * - 밤 트랙 (`night-loop.mp3`): KST 00:00 ~ 03:59 재생 (히든 트랙)
 * - UI 노출 없음 (이스터에그 느낌)
 * - 브라우저 자동재생 정책에 막히면 첫 사용자 인터랙션에서 시작
 * - 1분마다 시간 재확인, 경계 통과 시 트랙 자동 전환
 * - 볼륨 0.18 (잔잔한 배경)
 */
import { useEffect, useRef } from "react";

const DAY_SRC = "/audio/day-loop.mp3";
const NIGHT_SRC = "/audio/night-loop.mp3";
const NIGHT_HOUR_START = 0; // 00:00 포함
const NIGHT_HOUR_END = 4;   // 04:00 미포함
const VOLUME = 0.18;
const TICK_MS = 60_000;

/**
 * 현재 KST 시각의 시(hour, 0~23)를 반환.
 */
function getKstHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
}

/**
 * 현재 시각에 재생해야 하는 트랙 src 를 반환.
 */
function pickTrack(hour: number): string {
  return hour >= NIGHT_HOUR_START && hour < NIGHT_HOUR_END ? NIGHT_SRC : DAY_SRC;
}

export function AmbientTrack() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactionHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    const audio = new Audio();
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    /**
     * 시간대에 맞는 트랙을 결정하고, 필요 시 src 를 바꾸며 재생을 시도.
     */
    function evaluate() {
      const nextSrc = pickTrack(getKstHour());
      // 경로 비교를 위해 audio.src 는 절대 URL 로 풀려있으므로 endsWith 사용
      const isCurrentTrack = audio.src.endsWith(nextSrc);

      if (!isCurrentTrack) {
        audio.src = nextSrc;
        audio.currentTime = 0;
      }

      if (audio.paused) {
        const promise = audio.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {
            // 자동재생 차단 → 첫 인터랙션 시 재시도
            attachInteractionListener();
          });
        }
      }
    }

    /**
     * 첫 사용자 인터랙션 후 1회만 재생 시도.
     */
    function attachInteractionListener() {
      if (interactionHandlerRef.current) return;
      const handler = () => {
        if (audio.paused) {
          audio.play().catch(() => {
            /* 무시 — 사용자 환경상 차단 */
          });
        }
        detachInteractionListener();
      };
      interactionHandlerRef.current = handler;
      window.addEventListener("pointerdown", handler, { once: true });
      window.addEventListener("keydown", handler, { once: true });
      window.addEventListener("touchstart", handler, { once: true });
    }

    function detachInteractionListener() {
      const handler = interactionHandlerRef.current;
      if (!handler) return;
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
      interactionHandlerRef.current = null;
    }

    // 초기 평가 + 주기적 재평가
    evaluate();
    const tickId = window.setInterval(evaluate, TICK_MS);

    // 탭 포커스 돌아오면 즉시 재평가
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") evaluate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(tickId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      detachInteractionListener();
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  return null;
}
