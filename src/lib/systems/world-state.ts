/**
 * 공동 세계 상태 — DB 없이 daily seed 로 결정.
 *
 * - 같은 날에는 모든 사용자가 같은 worldState 를 본다.
 * - 시스템 수치 없음. 문장과 톤만.
 */

import { getDailySeed, seedValue } from "./daily-seed";

export type WorldDominantMood =
  | "quiet"
  | "unstable"
  | "dreamlike"
  | "warm"
  | "fractured";

export type WorldActiveEntity = "luna" | "rael" | "gael";

export interface WorldState {
  dominantMood: WorldDominantMood;
  activeEntity: WorldActiveEntity;
  globalNote: string;
  /** 오늘 변화 강도 — 색감/광원 미세 보정용 (0~1). */
  intensity: number;
}

/** 전체 후보 mood. */
const MOOD_POOL: readonly WorldDominantMood[] = [
  "quiet",
  "unstable",
  "dreamlike",
  "warm",
  "fractured",
] as const;

/** 전체 후보 존재. */
const ENTITY_POOL: readonly WorldActiveEntity[] = [
  "luna",
  "rael",
  "gael",
] as const;

/** mood 별 한 줄 노트 후보. */
const GLOBAL_NOTES: Record<WorldDominantMood, readonly string[]> = {
  quiet: [
    "세계의 흐름이 평소보다 조용합니다.",
    "오늘은 모두가 조금 멀리 떨어져 있습니다.",
  ],
  unstable: [
    "오늘은 유난히 불안정한 질문이 많았습니다.",
    "기록 손실이 자주 발생하고 있습니다.",
  ],
  dreamlike: [
    "오늘의 빛은 평소보다 더 느리게 흐릅니다.",
    "꿈에서 새어 나온 문장이 많은 날입니다.",
  ],
  warm: [
    "오늘은 부드러운 흐름이 두드러집니다.",
    "라엘이 평소보다 더 가까이 있습니다.",
  ],
  fractured: [
    "균열이 잦은 날입니다.",
    "오늘은 가엘이 자주 깨어 있습니다.",
  ],
};

/** mood 한국어 라벨. */
export const MOOD_LABEL: Record<WorldDominantMood, string> = {
  quiet: "고요",
  unstable: "불안정",
  dreamlike: "몽환",
  warm: "온기",
  fractured: "균열",
};

/** mood 별 문장형 표현. */
export const MOOD_NARRATIVE: Record<WorldDominantMood, string> = {
  quiet: "오늘은 세계가 한 박자 늦게 숨을 쉽니다.",
  unstable: "오늘의 결은 자주 흔들립니다.",
  dreamlike: "오늘의 시간은 평소보다 느리게 흐릅니다.",
  warm: "오늘의 공기는 평소보다 부드럽습니다.",
  fractured: "오늘은 경계가 더 얇아져 있습니다.",
};

/** 존재 한국어 라벨. */
export const ENTITY_LABEL: Record<WorldActiveEntity, string> = {
  luna: "루나",
  rael: "라엘",
  gael: "가엘",
};

/**
 * 오늘의 공동 세계 상태를 반환한다.
 *
 * 같은 KST 날짜에는 항상 동일한 값을 반환한다.
 */
export function getTodayWorldState(): WorldState {
  const seed = getDailySeed();

  const moodIdx = Math.floor(seedValue(seed, 100) * MOOD_POOL.length);
  const dominantMood: WorldDominantMood = MOOD_POOL[moodIdx] ?? "quiet";

  const entityIdx = Math.floor(seedValue(seed, 101) * ENTITY_POOL.length);
  const activeEntity: WorldActiveEntity = ENTITY_POOL[entityIdx] ?? "luna";

  const notes = GLOBAL_NOTES[dominantMood];
  const noteIdx = Math.floor(seedValue(seed, 102) * notes.length);
  const globalNote = notes[noteIdx] ?? notes[0] ?? "";

  const intensity = seedValue(seed, 103);

  return { dominantMood, activeEntity, globalNote, intensity };
}
