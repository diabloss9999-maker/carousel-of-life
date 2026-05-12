/**
 * 존재 기분(Entity Mood) 시스템.
 *
 * - 매일 / 시간대 / 균열 / 반복 질문 / 밤 방문 횟수에 따라
 *   각 존재의 "오늘 기분"이 미세하게 달라진다.
 * - 결과는 시스템 프롬프트의 톤 조정 컨텍스트와 CSS 클래스 힌트로 반환된다.
 */

export type EntityMood =
  | "calm"
  | "distant"
  | "curious"
  | "unstable"
  | "protective"
  | "silent";

export interface EntityState {
  id: "luna" | "rael" | "gael";
  mood: EntityMood;
}

/** 존재 기분 계산. */
export function computeEntityMood(opts: {
  entityId: "luna" | "rael" | "gael";
  seed: number;
  kstHour: number;
  fractureLevel: number;
  repeatedQuestionCount: number;
  nightVisitCount: number;
}): EntityMood {
  const {
    entityId,
    seed,
    kstHour,
    fractureLevel,
    repeatedQuestionCount,
    nightVisitCount,
  } = opts;
  const isNight = kstHour >= 19 || kstHour < 7;
  const isDawn = kstHour >= 2 && kstHour < 5;
  const base = seed * 6;

  switch (entityId) {
    case "luna": {
      if (fractureLevel >= 4) return "silent";
      if (isDawn) return seed < 0.5 ? "curious" : "distant";
      if (isNight && nightVisitCount >= 5) return "protective";
      if (repeatedQuestionCount >= 3) return "distant";
      return base < 2 ? "calm" : base < 4 ? "curious" : "distant";
    }
    case "rael": {
      if (fractureLevel >= 3) return "unstable";
      if (kstHour >= 7 && kstHour < 19) return base < 3 ? "calm" : "protective";
      return "calm";
    }
    case "gael": {
      if (fractureLevel >= 4) return base < 0.5 ? "unstable" : "curious";
      if (repeatedQuestionCount >= 5) return "distant";
      if (repeatedQuestionCount >= 2) return "curious";
      return base < 2 ? "calm" : base < 4 ? "curious" : "distant";
    }
  }
}

/** mood → 시스템 프롬프트에 추가할 짧은 컨텍스트. */
export const MOOD_CONTEXT: Record<EntityMood, string> = {
  calm: "",
  distant:
    "\n\n[현재 상태] 오늘은 조금 거리를 두고 싶다. 답을 주되 짧게, 때로는 질문으로 돌릴 것.",
  curious:
    "\n\n[현재 상태] 오늘은 사용자에게 더 관심이 간다. 질문을 하거나 관찰하는 투로.",
  unstable:
    "\n\n[현재 상태] 오늘은 균열이 느껴진다. 말이 약간 불규칙하거나 여운이 남게.",
  protective:
    "\n\n[현재 상태] 오늘은 사용자를 감싸고 싶다. 더 따뜻하고 가까이.",
  silent:
    "\n\n[현재 상태] 오늘은 말이 없다. 아주 짧게, 또는 침묵으로 표현해도 됨. '……' 사용 가능.",
};

/** mood → CSS 힌트 클래스. */
export const MOOD_CLASS: Record<EntityMood, string> = {
  calm: "entity-mood-calm",
  distant: "entity-mood-distant",
  curious: "entity-mood-curious",
  unstable: "entity-mood-unstable",
  protective: "entity-mood-protective",
  silent: "entity-mood-silent",
};
