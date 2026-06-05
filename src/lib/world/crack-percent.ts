import { getDailySeed, seedValue } from "@/lib/systems/daily-seed";

/**
 * 흐림 점수(0~100)를 사용자에게 보여줄 % 수치(1~89)로 변환한다.
 *
 * - 같은 날·같은 점수에는 결정론적으로 동일한 값을 반환한다.
 * - daily seed 기반으로 매일 살짝씩 흔들린다 (±2%).
 * - 점수가 1점만 올라도 % 가 미세하게 변하도록 score 직접 매핑.
 *
 * 레벨별 % 구간 (기존 디자인 유지):
 *  Lv.0 (점수 0~19)   → 8~20%
 *  Lv.1 (점수 20~39)  → 21~36%
 *  Lv.2 (점수 40~59)  → 38~56%
 *  Lv.3 (점수 60~79)  → 58~76%
 *  Lv.4 (점수 80~100) → 78~89%
 */
export function crackToPercent(score: number): number {
  const safe = Math.max(0, Math.min(100, score));
  const level = scoreToLevel(safe);

  const LEVEL_BASE = [8, 21, 38, 58, 78] as const;
  const LEVEL_TOP = [20, 36, 56, 76, 89] as const;
  const LEVEL_LO = [0, 20, 40, 60, 80] as const;
  const LEVEL_HI = [20, 40, 60, 80, 101] as const;

  const base = LEVEL_BASE[level];
  const top = LEVEL_TOP[level];
  const lo = LEVEL_LO[level];
  const hi = LEVEL_HI[level];

  // 레벨 안에서 점수가 어디쯤인지(0~1) 비율로 환산해 base~top 사이로 매핑.
  const ratio = (safe - lo) / Math.max(1, hi - lo);
  const linear = base + Math.round(ratio * (top - base));

  // 매일 살짝 흔들림 ±2.
  const seed = getDailySeed();
  const noise = Math.floor(seedValue(seed, 200 + level) * 5) - 2;

  return Math.max(1, Math.min(89, linear + noise));
}

/** 점수 → 레벨 (0~4). */
function scoreToLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

/** 크랙 레벨에 대응하는 한국어 라벨. */
export function crackLabel(
  level: number,
): "안정" | "파동" | "흐림" | "주의" | "가까움" {
  if (level >= 4) return "가까움";
  if (level >= 3) return "주의";
  if (level >= 2) return "흐림";
  if (level >= 1) return "파동";
  return "안정";
}
