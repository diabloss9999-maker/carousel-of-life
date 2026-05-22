"use client";

/**
 * 윈도우 location.hash 를 React 상태로 동기화하는 훅.
 *
 * useSyncExternalStore 기반이라 React 19 의 setState-in-effect 안티패턴 회피.
 * SSR 안전 (서버에서는 빈 문자열).
 */
import { useSyncExternalStore } from "react";

function subscribe(notify: () => void): () => void {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}

function getSnapshot(): string {
  return window.location.hash;
}

function getServerSnapshot(): string {
  return "";
}

export function useLocationHash(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
