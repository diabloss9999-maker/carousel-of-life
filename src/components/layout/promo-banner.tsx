/**
 * 무료 개방일 알림 배너.
 *
 * 서버 컴포넌트 — isFreeAccessDay() 가 true 일 때만 렌더. 페이지 상단에 한 줄
 * 광고처럼 깔린다. 자정(KST) 지나면 자동으로 숨겨짐.
 */
import { isFreeAccessDay } from "@/lib/payment/promo";

export function PromoBanner() {
  if (!isFreeAccessDay()) return null;
  return (
    <div
      data-keep-color
      className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 px-4 py-2 text-center text-[15px] font-medium tracking-wide text-white shadow-md"
    >
      ✦ 오늘 하루 — 모든 풀이 무료 개방 · 자정(KST) 까지 ✦
    </div>
  );
}
