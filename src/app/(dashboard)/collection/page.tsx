import type { Metadata } from "next";

import { CollectionView } from "@/components/collection/collection-view";
import { TOTAL_CARDS } from "@/lib/collection/cards-data";
import {
  getOwnedCardIds,
  getOwnedCount,
  getTodayGachaStatus,
} from "@/lib/collection/service";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

export const metadata: Metadata = {
  title: "기억 보관소",
  description:
    "매일 카드 뽑기로 모으는 나만의 카드 도감 — 194장 컬렉션.",
};

/**
 * 카드 컬렉션 페이지.
 *
 * - 매일 가챠 (무료 1회 / 라이트 3회) 로 카드를 모은다.
 * - 131 장 중 사용자가 소장한 카드의 진행도와 그리드를 표시한다.
 */
export default async function CollectionPage() {
  const { profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId);

  const [status, ownedSet, ownedCount] = await Promise.all([
    getTodayGachaStatus(profile.userId),
    getOwnedCardIds(profile.userId),
    getOwnedCount(profile.userId),
  ]);

  const ownedIds = Array.from(ownedSet);
  const percent = Math.min(
    100,
    Math.round((ownedCount / TOTAL_CARDS) * 100),
  );

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/memory-vessel.svg" alt="" aria-hidden className="h-6 w-6 opacity-60" />
              <h1 className="font-mystic text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                기억 보관소
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              기억의 조각들이 여기 쌓인다.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mystic text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {ownedCount}
              <span className="text-base font-normal text-muted-foreground">
                {" / "}
                {TOTAL_CARDS}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">소장 카드</p>
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
        <p className="text-right text-[11px] tabular-nums text-muted-foreground">
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
