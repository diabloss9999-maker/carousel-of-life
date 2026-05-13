"use client";

/**
 * 배경 BGM — 시간대에 따라 두 트랙을 자동 교차 재생.
 *
 * - 낮 트랙 (`day-loop.mp3`): KST 04:00 ~ 23:59 재생
 * - 밤 트랙 (`night-loop.mp3`): KST 00:00 ~ 03:59 재생 (히든 트랙)
 * - UI 노출 없음 (이스터에그 느낌)
 * - 브라우저 자동재생 정책에 막히면 첫 사용자 인터랙션에서 시작
 * - 1분마다 시간 재확인, 경계 통과 시 트랙 자동 전환
 * - 사용자가 헤더의 음소거 토글로 끄면 페이드아웃 후 정지
 * - 시작/정지/트랙 전환 시 0.4초 페이드 인·아웃
 * - 목표 볼륨 0.18 (잔잔한 배경)
 */
import { useEffect, useRef } from "react";

import {
  getAmbientMuted,
  hydrateAmbientStore,
  subscribeAmbient,
} from "./ambient-store";

const DAY_SRC = "/audio/day-loop.mp3";
const NIGHT_SRC = "/audio/night-loop.mp3";
const NIGHT_HOUR_START = 0; // 00:00 포함
const NIGHT_HOUR_END = 4;   // 04:00 미포함
const TARGET_VOLUME = 0.18;
const FADE_MS = 400;
const FADE_STEP_MS = 40;
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
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    // localStorage 에서 음소거 상태 로드
    hydrateAmbientStore();

    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0; // 페이드 인으로 자연스럽게 올림
    audio.preload = "auto";
    audioRef.current = audio;

    /**
     * 진행 중인 페이드 인터벌을 정리.
     */
    function clearFade() {
      if (fadeIntervalRef.current !== null) {
        window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }

    /**
     * 현재 볼륨에서 목표 볼륨까지 선형 페이드.
     * 페이드 끝나면 onComplete 호출.
     */
    function fadeTo(target: number, onComplete?: () => void) {
      clearFade();
      const start = audio.volume;
      const delta = target - start;
      const steps = Math.max(1, Math.floor(FADE_MS / FADE_STEP_MS));
      let stepIndex = 0;
      fadeIntervalRef.current = window.setInterval(() => {
        stepIndex += 1;
        const progress = stepIndex / steps;
        audio.volume = Math.max(0, Math.min(1, start + delta * progress));
        if (stepIndex >= steps) {
          clearFade();
          onComplete?.();
        }
      }, FADE_STEP_MS);
    }

    /**
     * 시간대에 맞는 트랙을 결정하고, 필요 시 src 를 바꾸며 재생을 시도.
     * 음소거 상태이면 페이드아웃 후 정지.
     */
    function evaluate() {
      // 사용자가 음소거를 켰으면 페이드아웃 후 정지
      if (getAmbientMuted()) {
        if (!audio.paused) {
          fadeTo(0, () => {
            audio.pause();
          });
        }
        return;
      }

      const nextSrc = pickTrack(getKstHour());
      const isCurrentTrack = audio.src.endsWith(nextSrc);

      // 트랙 전환 — 페이드아웃 후 src 교체 후 페이드인
      if (!isCurrentTrack && audio.src) {
        fadeTo(0, () => {
          audio.src = nextSrc;
          audio.currentTime = 0;
          startPlayWithFadeIn();
        });
        return;
      }

      // 최초 src 설정
      if (!isCurrentTrack) {
        audio.src = nextSrc;
        audio.currentTime = 0;
      }

      if (audio.paused) {
        startPlayWithFadeIn();
      }
    }

    /**
     * 재생을 시작하고 목표 볼륨까지 페이드 인.
     * 자동재생 차단 시 인터랙션 리스너 부착.
     */
    function startPlayWithFadeIn() {
      audio.volume = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === "function") {
        promise
          .then(() => fadeTo(TARGET_VOLUME))
          .catch(() => {
            attachInteractionListener();
          });
      } else {
        fadeTo(TARGET_VOLUME);
      }
    }

    /**
     * 첫 사용자 인터랙션 후 1회만 재생 시도.
     */
    function attachInteractionListener() {
      if (interactionHandlerRef.current) return;
      const handler = () => {
        if (!getAmbientMuted() && audio.paused) {
          startPlayWithFadeIn();
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

    // 음소거 토글 시 즉시 재평가
    const unsubscribeStore = subscribeAmbient(evaluate);

    return () => {
      window.clearInterval(tickId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      detachInteractionListener();
      unsubscribeStore();
      clearFade();
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  return null;
}
