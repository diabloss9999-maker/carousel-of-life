"use client";

/**
 * 글로벌 BGM 음소거 토글 — 비대시보드 페이지(랜딩/로그인/가입/요금제)에서 fixed 표시.
 *
 * 대시보드 페이지는 이미 헤더 내 `MusicToggle` 이 있으므로 중복을 막기 위해 렌더 생략.
 */
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";

import {
  getAmbientMuted,
  getAmbientMutedServerSnapshot,
  subscribeAmbient,
  toggleAmbientMuted,
} from "./ambient-store";

/** 대시보드 라우트 prefix — 이 경로들에서는 글로벌 토글이 숨겨진다. */
const DASHBOARD_PREFIXES = [
  "/today",
  "/chat",
  "/tarot",
  "/saju",
  "/personality",
  "/history",
  "/collection",
  "/world",
  "/settings",
  "/onboarding",
  "/compatibility",
  "/archive",
] as const;

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function GlobalMusicToggle() {
  const pathname = usePathname();
  const muted = useSyncExternalStore(
    subscribeAmbient,
    getAmbientMuted,
    getAmbientMutedServerSnapshot,
  );

  if (isDashboardRoute(pathname)) return null;

  return (
    <button
      type="button"
      onClick={toggleAmbientMuted}
      aria-label={muted ? "배경 음악 켜기" : "배경 음악 끄기"}
      title={muted ? "배경 음악 켜기" : "배경 음악 끄기"}
      className="fixed z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-opacity hover:opacity-80"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        right: "calc(env(safe-area-inset-right, 0px) + 16px)",
        borderColor: "rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      {muted ? (
        <VolumeX className="h-4 w-4" aria-hidden />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
