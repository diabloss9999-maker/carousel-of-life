"use client";

/**
 * 오늘의 세계 프로필 + 존재별 기분 통합 훅.
 *
 * - daily seed 기반의 오늘의 속삭임 한 문장 반환
 * - luna / rael / gael 각 존재의 mood 계산
 * - 균열 상태 + 존재 기억 동시 노출
 */
import { useMemo } from "react";

import { useEntityMemory } from "@/hooks/use-entity-memory";
import { useFractureSystem } from "@/hooks/use-fracture-system";
import { getDailySeed, getTodayWhisper, seedValue } from "@/lib/systems/daily-seed";
import { computeEntityMood, type EntityMood } from "@/lib/systems/entity-mood";
import {
  computeWorldProfile,
  type WorldProfile,
} from "@/lib/systems/world-profile";
import type { EntityMemory } from "@/lib/entity/entity-memory";
import type { FractureState } from "@/lib/fracture/fracture-state";

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

export interface UseWorldProfileResult {
  seed: number;
  todayWhisper: string;
  lunaMood: EntityMood;
  raelMood: EntityMood;
  gaelMood: EntityMood;
  fracture: FractureState;
  memory: EntityMemory;
  profile: WorldProfile;
}

export function useWorldProfile(): UseWorldProfileResult {
  const { memory } = useEntityMemory();
  const { state: fracture } = useFractureSystem();
  const kstHour = getKstHour();

  return useMemo(() => {
    const seed = getDailySeed();
    const todayWhisper = getTodayWhisper(seed);

    const lunaMood = computeEntityMood({
      entityId: "luna",
      seed: seedValue(seed, 10),
      kstHour,
      fractureLevel: fracture.level,
      repeatedQuestionCount: fracture.repeatedQuestionCount,
      nightVisitCount: memory.nightVisitCount,
    });
    const raelMood = computeEntityMood({
      entityId: "rael",
      seed: seedValue(seed, 11),
      kstHour,
      fractureLevel: fracture.level,
      repeatedQuestionCount: fracture.repeatedQuestionCount,
      nightVisitCount: memory.nightVisitCount,
    });
    const gaelMood = computeEntityMood({
      entityId: "gael",
      seed: seedValue(seed, 12),
      kstHour,
      fractureLevel: fracture.level,
      repeatedQuestionCount: fracture.repeatedQuestionCount,
      nightVisitCount: memory.nightVisitCount,
    });

    const profile = computeWorldProfile(memory, fracture, seed);

    return {
      seed,
      todayWhisper,
      lunaMood,
      raelMood,
      gaelMood,
      fracture,
      memory,
      profile,
    };
  }, [fracture, memory, kstHour]);
}
