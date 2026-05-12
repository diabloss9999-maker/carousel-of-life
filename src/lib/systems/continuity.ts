/**
 * 연속 방문 메시지(Continuity Note).
 *
 * - streak 일수에 따른 세계관 문구를 반환한다.
 * - "출석체크" 처럼 보이지 않도록 자연스러운 톤으로 작성한다.
 */

/** streak 일수 → 세계관 문구. null 이면 표시하지 않음. */
export function getContinuityNote(streakDays: number): string | null {
  if (streakDays < 3) return null;
  if (streakDays >= 30) return "이 세계는 당신의 흔적을 쉽게 잊지 않습니다.";
  if (streakDays >= 14) return "루나는 이제 당신의 방문 간격을 기억합니다.";
  if (streakDays >= 7) return "당신의 기록이 조금 더 선명해졌습니다.";
  if (streakDays >= 3) return "흐름이 끊기지 않고 이어지고 있습니다.";
  return null;
}
