/**
 * 존재 기억(Entity Memory) — localStorage 기반 확장 데이터.
 *
 * fracture-state 의 visitCount/level 과는 별개로,
 * "세계가 사용자에 대해 기억하고 있는 것" 을 보관한다.
 * 게임화 금지 — 숫자가 아니라 패턴/문장으로 표현될 데이터.
 */

export interface EntityMemory {
  // ── 방문 패턴 ─────────────────────────────────────────
  /** 누적 방문 횟수. */
  visitCount: number;
  /** 마지막 방문 시각 (ms timestamp). */
  lastVisitAt: number;
  /** 가장 최근 방문한 시간대 (0~23, KST). 간소화: 마지막 방문 시각. */
  mostActiveHour: number;
  /** 19~06시 (밤) 방문 누적. */
  nightVisitCount: number;
  /** 02~04시 (새벽) 방문 누적. */
  dawnVisitCount: number;

  // ── 존재별 상호작용 ───────────────────────────────────
  /** 루나(witch) 대화 횟수. */
  lunaInteractions: number;
  /** 라엘(sage) 대화 횟수. */
  raelInteractions: number;
  /** 카엘(child) 대화 횟수. */
  gaelInteractions: number;
  /** 가장 많이 상호작용한 존재. */
  preferredEntity: "luna" | "rael" | "gael" | null;

  // ── 행동 패턴 ─────────────────────────────────────────
  /** 같은 카드를 반복 선택한 누적 횟수. */
  repeatedCardCount: number;
  /** 마지막으로 반복 선택된 카드. */
  lastRepeatedCard: string | null;
  /** 흐림 이벤트를 목격한 누적 횟수. */
  fractureEventsWitnessed: number;
  /** 가장 긴 세션 길이 (분). */
  longestSessionMinutes: number;

  // ── 패턴 이름 ─────────────────────────────────────────
  /** 계산된 기록 패턴 이름. */
  patternName: string | null;
}

const EM_KEY = "carousel_entity_memory";

/** 새벽 시간대 범위 (KST). */
const DAWN_HOUR_START = 2;
const DAWN_HOUR_END = 5;
/** 밤 시간대 범위 (KST). */
const NIGHT_HOUR_START = 19;
const NIGHT_HOUR_END = 7;

const DEFAULT_MEMORY: EntityMemory = {
  visitCount: 0,
  lastVisitAt: 0,
  mostActiveHour: 0,
  nightVisitCount: 0,
  dawnVisitCount: 0,
  lunaInteractions: 0,
  raelInteractions: 0,
  gaelInteractions: 0,
  preferredEntity: null,
  repeatedCardCount: 0,
  lastRepeatedCard: null,
  fractureEventsWitnessed: 0,
  longestSessionMinutes: 0,
  patternName: null,
};

/** 안전하게 localStorage 접근 가능한지 검사한다. */
function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/** localStorage 에서 존재 기억을 불러온다. */
export function loadEntityMemory(): EntityMemory {
  if (!canUseStorage()) return { ...DEFAULT_MEMORY };
  try {
    const raw = window.localStorage.getItem(EM_KEY);
    if (!raw) return { ...DEFAULT_MEMORY };
    const parsed = JSON.parse(raw) as Partial<EntityMemory>;
    return { ...DEFAULT_MEMORY, ...parsed };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

/** 존재 기억을 localStorage 에 저장한다. */
export function saveEntityMemory(memory: EntityMemory): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(EM_KEY, JSON.stringify(memory));
  } catch {
    /* quota / privacy mode 등은 무시 */
  }
}

/**
 * 방문 시 호출 — 시간대 카운터 갱신.
 *
 * @param memory 현재 기억 상태
 * @param kstHour KST 기준 현재 시(0~23)
 */
export function recordEntityVisit(
  memory: EntityMemory,
  kstHour: number,
): EntityMemory {
  const isNight = kstHour >= NIGHT_HOUR_START || kstHour < NIGHT_HOUR_END;
  const isDawn = kstHour >= DAWN_HOUR_START && kstHour < DAWN_HOUR_END;
  return {
    ...memory,
    visitCount: memory.visitCount + 1,
    lastVisitAt: Date.now(),
    mostActiveHour: kstHour,
    nightVisitCount: memory.nightVisitCount + (isNight ? 1 : 0),
    dawnVisitCount: memory.dawnVisitCount + (isDawn ? 1 : 0),
  };
}

/** 기록 패턴 이름을 계산한다. */
export function computePatternName(memory: EntityMemory): string {
  if (memory.dawnVisitCount >= 3) return "새벽의 기록자";
  if (memory.repeatedCardCount >= 5) return "반복된 질문자";
  if (memory.nightVisitCount >= 10) return "밤의 방문자";
  if (memory.fractureEventsWitnessed >= 3) return "흐림 추적자";
  if (memory.longestSessionMinutes >= 30) return "침묵 기록자";
  return "결의 기록자";
}
