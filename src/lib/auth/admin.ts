/**
 * 마스터 운영자 계정 식별.
 *
 * 마스터는 모든 스토리 챕터·진실 루트가 호감도 무관 해금 상태로 표시되고,
 * 향후 운영 관련 기능을 자동 부여받을 수 있다.
 *
 * (server-only 의존성 없음 — 클라이언트에도 안전하게 사용 가능)
 */

/** 마스터 권한이 부여되는 이메일 목록. */
const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "diabloss9999@gmail.com",
]);

/**
 * 주어진 이메일이 마스터 운영자인지 판정한다.
 *
 * @param email Supabase user.email — undefined/null 입력에도 안전
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
