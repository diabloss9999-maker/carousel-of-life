import type { CharacterId } from "@/lib/chat/characters";

export interface AffinityLevel {
  level: number;
  label: string;
  minPoints: number;
  nextPoints: number | null;
}

export const MAX_AFFINITY_LEVEL = 100;
export const AFFINITY_LABEL = "호감도";

/**
 * 호감도는 100레벨까지 확장한다.
 *
 * 현재 채팅 응답 1회 완료 시 1점이 오르므로, 1레벨당 10점 간격으로 계산한다.
 * Lv.1 = 0~9점, Lv.2 = 10~19점, ..., Lv.100 = 990점 이상.
 */
export const POINTS_PER_AFFINITY_LEVEL = 10;

export function pointsForAffinityLevel(level: number): number {
  const normalized = Math.max(1, Math.min(MAX_AFFINITY_LEVEL, Math.floor(level)));
  return (normalized - 1) * POINTS_PER_AFFINITY_LEVEL;
}

export function affinityRewardCardId(
  characterId: CharacterId,
  level: number,
): string {
  const normalized = Math.max(1, Math.min(MAX_AFFINITY_LEVEL, Math.floor(level)));
  return `${characterId}_affinity_${String(normalized).padStart(3, "0")}`;
}

export function calcLevel(
  _characterId: CharacterId,
  points: number,
): AffinityLevel {
  const safePoints = Math.max(0, Math.floor(points));
  const level = Math.min(
    MAX_AFFINITY_LEVEL,
    Math.floor(safePoints / POINTS_PER_AFFINITY_LEVEL) + 1,
  );
  const minPoints = pointsForAffinityLevel(level);
  const nextPoints =
    level < MAX_AFFINITY_LEVEL
      ? pointsForAffinityLevel(level + 1)
      : null;

  return {
    level,
    label: AFFINITY_LABEL,
    minPoints,
    nextPoints,
  };
}
