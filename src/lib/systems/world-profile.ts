/**
 * 세계 프로필(World Profile).
 *
 * - 존재 기억 + 균열 상태 + 오늘 seed 를 종합해
 *   오늘의 세계가 어떤 톤으로 사용자를 맞이할지 결정한다.
 */
import type { EntityMemory } from "@/lib/entity/entity-memory";
import type { FractureState } from "@/lib/fracture/fracture-state";

import { getTodayDominantEntity, getTodayWorldTone } from "./daily-seed";

export interface WorldProfile {
  dominantEntity: "luna" | "rael" | "gael";
  worldTone: "soft" | "bright" | "fractured" | "quiet" | "dreamlike";
  /** 0~1. 희소 이벤트 발생 가중치. */
  rareEventBias: number;
  /** 0~1. 새벽 감응도. */
  dawnSensitivity: number;
  /** 0~1. 누적 방문 밀도. */
  memoryDensity: number;
}

/** 존재 기억 + 균열 + daily seed → 세계 프로필. */
export function computeWorldProfile(
  memory: EntityMemory,
  fracture: FractureState,
  dailySeed: number,
): WorldProfile {
  const max = Math.max(
    memory.lunaInteractions,
    memory.raelInteractions,
    memory.gaelInteractions,
  );

  let dominantEntity: WorldProfile["dominantEntity"];
  if (max === 0) {
    dominantEntity = getTodayDominantEntity(dailySeed);
  } else if (memory.lunaInteractions === max) {
    dominantEntity = "luna";
  } else if (memory.raelInteractions === max) {
    dominantEntity = "rael";
  } else {
    dominantEntity = "gael";
  }

  const worldTone: WorldProfile["worldTone"] =
    fracture.level >= 4
      ? "fractured"
      : memory.dawnVisitCount >= 5
        ? "dreamlike"
        : getTodayWorldTone(dailySeed);

  return {
    dominantEntity,
    worldTone,
    rareEventBias: Math.min(1, fracture.level / 5 + memory.nightVisitCount / 20),
    dawnSensitivity: Math.min(1, memory.dawnVisitCount / 10),
    memoryDensity: Math.min(1, memory.visitCount / 50),
  };
}
