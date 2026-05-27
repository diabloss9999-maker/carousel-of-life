import type { Metadata } from "next";

import { CollectionView } from "@/components/collection/collection-view";
import {
  COLLECTION_BY_CATEGORY,
  TOTAL_CARDS,
  type CollectionCategory,
} from "@/lib/collection/cards-data";
import {
  getOwnedCardIds,
  getOwnedCount,
  getTodayGachaStatus,
} from "@/lib/collection/service";
import { requireProfile } from "@/lib/auth/get-user";
import { isAdmin } from "@/lib/auth/admin";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "도감",
  description:
    "매일 카드 뽑기로 모으는 나만의 카드 도감 — 257장 컬렉션.",
};

/**
 * 카드 컬렉션 페이지.
 *
 * - 매일 가챠 (무료 1회 / 라이트 3회) 로 카드를 모은다.
 * - 131 장 중 사용자가 소장한 카드의 진행도와 그리드를 표시한다.
 */
export default async function CollectionPage() {
  const { user, profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId);
  const adminMode = isAdmin(user.email);
  const t = await getTranslations("collection");

  const [status, ownedSet, ownedCount] = await Promise.all([
    getTodayGachaStatus(profile.userId),
    getOwnedCardIds(profile.userId),
    getOwnedCount(profile.userId),
  ]);

  // 마스터 운영자는 도감의 모든 카드를 소장 상태로 표시한다.
  // (DB 데이터는 건드리지 않고 화면 노출만 전부 unlocked.)
  let ownedIds: string[];
  let displayOwnedCount: number;
  if (adminMode) {
    const allIds: string[] = [];
    for (const cat of Object.keys(COLLECTION_BY_CATEGORY) as CollectionCategory[]) {
      for (const card of COLLECTION_BY_CATEGORY[cat]) allIds.push(card.id);
    }
    ownedIds = allIds;
    displayOwnedCount = TOTAL_CARDS;
  } else {
    ownedIds = Array.from(ownedSet);
    displayOwnedCount = ownedCount;
  }

  const percent = Math.min(
    100,
    Math.round((displayOwnedCount / TOTAL_CARDS) * 100),
  );

  return (
    // 도감 wrapper 에 data-keep-color 박으면 globals.css 의 body * catchall
    // (모든 텍스트 강제 검정 !important) 의 예외로 들어가 자식 모두 흰색.
    // 다이얼로그 안 배지(amber/sky/stone) 는 자체 text-{color} 명시지만
    // catchall 이 더 강해서 검정 — 이 wrapper 안에서는 모두 흰색으로 통일.
    <div data-keep-color className="space-y-7">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <img src="/icons/memory-vessel.svg" alt="" aria-hidden className="h-6 w-6 opacity-60" />
              <h1 className="font-mystic text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-3xl">
                {t("title")}
              </h1>
            </div>
            <p className="mt-1 text-[15px] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {t("description")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mystic text-2xl font-bold tabular-nums text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-3xl">
              {displayOwnedCount}
              <span className="text-base font-normal text-white/75">
                {" / "}
                {TOTAL_CARDS}
              </span>
            </p>
            <p className="text-[15px] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {adminMode ? "마스터 — 전체 공개" : "소장 카드"}
            </p>
          </div>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted/50"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="컬렉션 진행도"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-right text-[15px] tabular-nums text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          {percent}% 달성
        </p>
      </header>

      <CollectionView
        ownedIds={ownedIds}
        gachaStatus={status}
        subscribed={subscribed}
      />
    </div>
  );
}
