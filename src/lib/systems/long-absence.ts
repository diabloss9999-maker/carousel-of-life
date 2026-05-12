/**
 * 오랜만 접속 인사 문장 — `lastVisitAt`(ms timestamp) 기준 부재 기간별 한 줄.
 *
 * - 게임화 금지. 사실의 관측 형태로만 표현한다.
 * - null 이면 표시하지 않는다.
 */

/** 30일 이상. */
const ABSENCE_DAYS_VERY_LONG = 30;
/** 14일 이상. */
const ABSENCE_DAYS_LONG = 14;
/** 7일 이상. */
const ABSENCE_DAYS_MEDIUM = 7;
/** 3일 이상. */
const ABSENCE_DAYS_SHORT = 3;
/** 하루(ms). */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * 부재 기간(일)에 따른 인사 문장을 반환한다.
 *
 * @param lastVisitAt 마지막 방문 시각 (ms timestamp). 0/누락이면 null.
 * @returns 표시할 문장 또는 null.
 */
export function getLongAbsenceGreeting(lastVisitAt: number): string | null {
  if (!lastVisitAt || lastVisitAt <= 0) return null;
  const daysAgo = Math.floor((Date.now() - lastVisitAt) / MS_PER_DAY);

  if (daysAgo >= ABSENCE_DAYS_VERY_LONG) {
    return "당신의 흔적이 거의 사라진 줄 알았습니다.";
  }
  if (daysAgo >= ABSENCE_DAYS_LONG) {
    return "오랫동안 관측이 중단되어 있었습니다.";
  }
  if (daysAgo >= ABSENCE_DAYS_MEDIUM) {
    return "루나는 당신이 다시 올 가능성을 낮게 보고 있었습니다.";
  }
  if (daysAgo >= ABSENCE_DAYS_SHORT) {
    return "기록이 잠시 비어 있었습니다.";
  }
  return null;
}
