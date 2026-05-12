/**
 * 균열 연출 시스템 — 상태 관리 (localStorage 기반).
 *
 * 사용자가 "어? 방금 뭐였지?" 라고 느끼는 미세한 이상 현상을 위한
 * 영속 상태를 보관한다. 공포가 아니라 앱이 나를 기억한다는 느낌이 목적.
 */

export interface FractureState {
  /** 0~100. 균열 누적 레벨. */
  level: number;
  /** 누적 방문 횟수. */
  visitCount: number;
  /** 마지막 방문 시각 (ms timestamp). */
  lastVisitAt: number;
  /** 반복된 질문 누적 횟수. */
  repeatedQuestionCount: number;
  /** 마지막으로 선택한 카드 식별자. */
  lastSelectedCard: string | null;
  /** 마지막으로 발생한 이벤트의 식별 텍스트 (중복 방지용). */
  lastEventType: string | null;
}

const STORAGE_KEY = "carousel_fracture";
const SESSION_KEY = "carousel_fracture_session";

/** 한 방문(=같은 lastVisitAt) 으로 묶을 시간 (ms). */
const RETURNING_THRESHOLD_MS = 30_000;

/** 방문 시 균열 레벨 가산치. */
const NIGHT_VISIT_BONUS = 3;
const RETURNING_VISIT_BONUS = 2;
const REPEATED_QUESTION_BONUS = 4;
const REPEATED_CARD_BONUS = 5;

const MAX_LEVEL = 100;

const DEFAULT_STATE: FractureState = {
  level: 0,
  visitCount: 0,
  lastVisitAt: 0,
  repeatedQuestionCount: 0,
  lastSelectedCard: null,
  lastEventType: null,
};

/** 안전하게 localStorage 접근 가능한지 검사한다. */
function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** localStorage 에서 균열 상태를 불러온다. */
export function loadFractureState(): FractureState {
  if (!canUseStorage()) return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<FractureState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** 균열 상태를 localStorage 에 저장한다. */
export function saveFractureState(state: FractureState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / privacy mode 등은 무시 */
  }
}

/** 세션당 발생한 이벤트 수 (sessionStorage — 탭 닫으면 리셋). */
export function getSessionEventCount(): number {
  if (!canUseStorage()) return 0;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/** 세션 이벤트 카운터를 1 증가시킨다. */
export function incrementSessionEventCount(): void {
  if (!canUseStorage()) return;
  try {
    const n = getSessionEventCount();
    window.sessionStorage.setItem(SESSION_KEY, String(n + 1));
  } catch {
    /* ignore */
  }
}

/**
 * 방문 시 호출 — visitCount 증가, 밤/재방문 시 level 소폭 증가.
 *
 * @param state 현재 상태
 * @param isNight 밤 시간대 여부 (19:00 ~ 06:59 KST)
 */
export function recordVisit(state: FractureState, isNight: boolean): FractureState {
  const now = Date.now();
  const isReturning =
    state.lastVisitAt > 0 && now - state.lastVisitAt > RETURNING_THRESHOLD_MS;
  const nightBonus = isNight ? NIGHT_VISIT_BONUS : 0;
  const visitBonus = isReturning ? RETURNING_VISIT_BONUS : 0;
  return {
    ...state,
    visitCount: state.visitCount + 1,
    lastVisitAt: now,
    level: Math.min(MAX_LEVEL, state.level + nightBonus + visitBonus),
  };
}

/** 반복 질문 시 호출. */
export function recordRepeatedQuestion(state: FractureState): FractureState {
  return {
    ...state,
    repeatedQuestionCount: state.repeatedQuestionCount + 1,
    level: Math.min(MAX_LEVEL, state.level + REPEATED_QUESTION_BONUS),
  };
}

/** 같은 카드 반복 시 호출. */
export function recordRepeatedCard(
  state: FractureState,
  card: string,
): FractureState {
  const bonus = state.lastSelectedCard === card ? REPEATED_CARD_BONUS : 0;
  return {
    ...state,
    lastSelectedCard: card,
    level: Math.min(MAX_LEVEL, state.level + bonus),
  };
}
