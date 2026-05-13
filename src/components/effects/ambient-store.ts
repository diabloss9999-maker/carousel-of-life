/**
 * 배경 BGM 음소거 상태 전역 스토어.
 *
 * - `AmbientTrack` 과 `MusicToggle` 가 공유.
 * - localStorage 에 사용자 선택 유지 (`ambient:muted`).
 * - useSyncExternalStore 친화적인 subscribe 패턴.
 */

const STORAGE_KEY = "ambient:muted";

let muted = false;
const listeners = new Set<() => void>();

/**
 * 클라이언트에서 1회 호출하여 localStorage 값을 메모리로 반영.
 */
export function hydrateAmbientStore(): void {
  if (typeof window === "undefined") return;
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
}

/**
 * 현재 음소거 상태 반환.
 */
export function getAmbientMuted(): boolean {
  return muted;
}

/**
 * 음소거 상태 설정 + localStorage 저장 + 구독자 알림.
 */
export function setAmbientMuted(next: boolean): void {
  if (muted === next) return;
  muted = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }
  listeners.forEach((listener) => listener());
}

/**
 * 음소거 토글.
 */
export function toggleAmbientMuted(): void {
  setAmbientMuted(!muted);
}

/**
 * 변경 구독.
 * @returns 구독 해제 함수
 */
export function subscribeAmbient(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * SSR 안전 getServerSnapshot — 항상 false 반환.
 */
export function getAmbientMutedServerSnapshot(): boolean {
  return false;
}
