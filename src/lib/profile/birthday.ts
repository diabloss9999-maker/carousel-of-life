/**
 * 생일 판별 헬퍼.
 *
 * profiles.birthDate("YYYY-MM-DD")의 월·일이 KST 오늘과 같은지 확인한다.
 * v1은 양력 기준 비교 (음력 생일은 추후 보강).
 */
export function isBirthdayTodayKst(
  birthDate: string | null | undefined,
): boolean {
  if (!birthDate || birthDate.length < 10) return false;
  const md = birthDate.slice(5, 10); // "MM-DD"
  const todayMd = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
    .slice(5, 10);
  return md === todayMd;
}
