"use client";

/**
 * 개인화된 관측 문장(Personalized Observation).
 *
 * 아카이브 페이지 상단에 작게 표시되는 사용자 고유 한 줄.
 * entity-memory / fracture-state 로부터 도출한 패턴 문장이 있을 때만 렌더링.
 *
 * - SSR 단계에서는 localStorage 접근 불가 → 서버 스냅샷은 null.
 * - 클라이언트 mount 후에만 패턴 문장을 계산하여 표시.
 * - useSyncExternalStore 로 effect 내부 setState 없이 외부 스토어를 구독.
 */
import { useSyncExternalStore } from "react";

import { loadEntityMemory } from "@/lib/entity/entity-memory";
import { loadFractureState } from "@/lib/fracture/fracture-state";
import { buildPersonalObservation } from "@/lib/systems/personal-observation";

/** 빈 구독자 — 외부 변화에 자동 반응하지 않는다 (mount 시점에 한 번 계산). */
function subscribe(): () => void {
  return () => {
    /* no-op */
  };
}

/** 클라이언트 스냅샷 — localStorage 에서 한 줄을 도출한다. */
function getClientSnapshot(): string | null {
  try {
    return buildPersonalObservation(loadEntityMemory(), loadFractureState());
  } catch {
    return null;
  }
}

/** 서버 스냅샷 — SSR/Hydration 안정성을 위해 null. */
function getServerSnapshot(): string | null {
  return null;
}

export function PersonalizedObservation() {
  const line = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!line) return null;

  return (
    <p className="text-xs text-muted-foreground/60 italic font-mystic leading-relaxed">
      &ldquo;{line}&rdquo;
    </p>
  );
}
