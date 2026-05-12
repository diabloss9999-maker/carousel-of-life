"use client";

/**
 * 존재 기억(Entity Memory) 진입점 훅.
 *
 * - 마운트 시 방문 1회 기록한다.
 * - 패턴 이름을 재계산하여 저장한다.
 * - 새벽 시간대 여부(isDawn)를 함께 반환한다.
 */
import { useEffect, useRef, useState } from "react";

import {
  computePatternName,
  loadEntityMemory,
  recordEntityVisit,
  saveEntityMemory,
  type EntityMemory,
} from "@/lib/entity/entity-memory";

const DAWN_HOUR_START = 2;
const DAWN_HOUR_END = 5;

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

export interface UseEntityMemoryResult {
  memory: EntityMemory;
  isDawn: boolean;
}

export function useEntityMemory(): UseEntityMemoryResult {
  const [memory, setMemory] = useState<EntityMemory>(() => loadEntityMemory());
  const [isDawn, setIsDawn] = useState<boolean>(() => {
    const h = getKstHour();
    return h >= DAWN_HOUR_START && h < DAWN_HOUR_END;
  });
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const kstHour = getKstHour();
    setIsDawn(kstHour >= DAWN_HOUR_START && kstHour < DAWN_HOUR_END);

    setMemory((prev) => {
      const visited = recordEntityVisit(prev, kstHour);
      const patternName = computePatternName(visited);
      const next: EntityMemory = { ...visited, patternName };
      saveEntityMemory(next);
      return next;
    });
  }, []);

  return { memory, isDawn };
}
