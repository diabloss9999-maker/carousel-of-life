import { getDailySeed, seedValue } from "@/lib/systems/daily-seed";

/**
 * 크랙 레벨(0~4)을 사용자에게 보여줄 % 수치(12~89)로 변환한다.
 *
 * - 같은 날·같은 레벨에는 결정론적으로 동일한 값을 반환한다.
 * - daily seed 기반으로 매일 살짝씩 흔들린다.
 */
export function crackToPercent(level: number): number {
  const seed = getDailySeed();
  const base =
    level >= 4
      ? 78
      : level >= 3
        ? 58
        : level >= 2
          ? 38
          : level >= 1
            ? 21
            : 8;
  const variance = Math.floor(seedValue(seed, 200 + level) * 14);
  return Math.min(89, base + variance);
}

/** 크랙 레벨에 대응하는 한국어 라벨. */
export function crackLabel(
  level: number,
): "안정" | "파동" | "균열" | "위험" | "임박" {
  if (level >= 4) return "임박";
  if (level >= 3) return "위험";
  if (level >= 2) return "균열";
  if (level >= 1) return "파동";
  return "안정";
}
