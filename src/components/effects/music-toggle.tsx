"use client";

/**
 * 헤더용 BGM 음소거 토글 버튼.
 *
 * - 클릭 시 `ambient-store` 의 음소거 상태 토글
 * - 아이콘: Volume2 (재생 중) / VolumeX (음소거)
 * - useSyncExternalStore 로 다른 컴포넌트와 상태 동기화
 */
import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getAmbientMuted,
  getAmbientMutedServerSnapshot,
  subscribeAmbient,
  toggleAmbientMuted,
} from "./ambient-store";

export function MusicToggle() {
  const muted = useSyncExternalStore(
    subscribeAmbient,
    getAmbientMuted,
    getAmbientMutedServerSnapshot,
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleAmbientMuted}
      aria-label={muted ? "배경 음악 켜기" : "배경 음악 끄기"}
      title={muted ? "배경 음악 켜기" : "배경 음악 끄기"}
      className="rounded-full px-3"
      style={{
        border: "1px solid var(--ritual-line)",
        color: "var(--ritual-muted)",
        background: "rgba(255,255,255,0.12)",
      }}
    >
      {muted ? (
        <VolumeX className="h-4 w-4" aria-hidden />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}
