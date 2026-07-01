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
    `매일 카드 뽑기로 모으는 나만의 카드 도감 — ${TOTAL_CARDS}장 컬렉션.`,
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
    // 보너스(도감) 페이지는 밝은 배경이라 전역 catchall(텍스트 검정)을 그대로 따른다.
    // 카드 이미지 위 라벨·다크 모달처럼 흰색이 필요한 곳에만 collection-view 내부에서
    // 개별적으로 data-keep-color 를 붙인다.
    <div className="space-y-7">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <img src="/icons/memory-vessel.svg" alt="" aria-hidden className="h-6 w-6 opacity-60" />
              <h1 className="font-mystic text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                {t("title")}
              </h1>
            </div>
            <p className="mt-1 text-[15px] text-zinc-600">
              {t("description")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mystic text-2xl font-bold tabular-nums text-zinc-900 sm:text-3xl">
              {displayOwnedCount}
              <span className="text-base font-normal text-zinc-500">
                {" / "}
                {TOTAL_CARDS}
              </span>
            </p>
            <p className="text-[15px] text-zinc-600">
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
        <p className="text-right text-[15px] tabular-nums text-zinc-600">
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
