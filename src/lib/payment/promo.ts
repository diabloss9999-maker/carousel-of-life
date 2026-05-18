/**
 * 프로모션 — 하루(또는 일정 기간) 모든 유료 기능 무료 개방.
 *
 * 동작 원리:
 *   환경변수 PROMO_FREE_DAY=YYYY-MM-DD (KST 기준 단일 날짜) 가 설정되어 있고
 *   KST 오늘 날짜가 그것과 일치하면 isFreeAccessDay() 가 true.
 *   true 일 때 hasActiveSubscription · getSubscriptionTier 가 PRO 로 동작 →
 *   quota 한도 자동 PRO 적용 + premium 카테고리 게이트 해제.
 *
 * 운영:
 *   - Vercel 환경변수에 PROMO_FREE_DAY=2026-05-19 설정 후 재배포
 *   - 자정(KST) 지나면 자동 종료 (날짜가 안 맞아짐)
 *   - 영구 종료 시 환경변수 제거 또는 빈 값
 */
import "server-only";

/** KST 기준 오늘 날짜를 YYYY-MM-DD 로 반환. */
function todayKst(): string {
  const now = new Date();
  const kst = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const d = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘이 무료 개방일인지. */
export function isFreeAccessDay(): boolean {
  const target = process.env.PROMO_FREE_DAY?.trim();
  if (!target) return false;
  return target === todayKst();
}
