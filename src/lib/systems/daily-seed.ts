/**
 * 오늘 날짜(KST) 기반 결정론적 seed 시스템.
 *
 * - 매일 다른 값을 반환하되, 같은 날에는 항상 동일.
 * - 우세 존재 / 세계 톤 / 오늘의 속삭임을 결정하는 데 쓰인다.
 */

/** KST 오늘 날짜 기반 숫자 seed (0~1). */
export function getDailySeed(): number {
  const kst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const dateStr = `${kst.getFullYear()}${kst.getMonth()}${kst.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

/** seed와 인덱스로 0~1 사이 값 반환. */
export function seedValue(seed: number, index: number): number {
  return ((seed * 9301 + index * 49297 + 233) % 1000) / 1000;
}

/** 오늘의 우세 존재 — "luna" | "rael" | "gael" */
export function getTodayDominantEntity(
  seed: number,
): "luna" | "rael" | "gael" {
  const v = seedValue(seed, 1);
  if (v < 0.33) return "luna";
  if (v < 0.66) return "rael";
  return "gael";
}

/** 오늘의 세계 톤. */
export function getTodayWorldTone(
  seed: number,
): "soft" | "bright" | "fractured" | "quiet" | "dreamlike" {
  const v = seedValue(seed, 2);
  if (v < 0.2) return "soft";
  if (v < 0.4) return "bright";
  if (v < 0.6) return "fractured";
  if (v < 0.8) return "quiet";
  return "dreamlike";
}

/** 오늘의 특별 문장 후보. */
export const DAILY_WHISPERS: readonly string[] = [
  "오늘의 빛은 조금 늦게 도착했습니다.",
  "이 기록은 오늘만 선명합니다.",
  "같은 문장이 다시 나타났습니다.",
  "누군가 먼저 지나간 흔적이 있습니다.",
  "오늘의 흐름은 평소와 조금 다릅니다.",
  "기록이 완전히 남지 않은 날입니다.",
  "경계가 오늘 더 가까이 있습니다.",
] as const;

/** 오늘의 속삭임 한 문장. */
export function getTodayWhisper(seed: number): string {
  const idx = Math.floor(seedValue(seed, 3) * DAILY_WHISPERS.length);
  return DAILY_WHISPERS[idx] ?? DAILY_WHISPERS[0]!;
}
