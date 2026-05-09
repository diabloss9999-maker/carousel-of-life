import type { Metadata } from "next";

import { CollectionView } from "@/components/collection/collection-view";
import { TOTAL_CARDS } from "@/lib/collection/cards-data";
import {
  getDiscoveredCollection,
  toPlain,
} from "@/lib/collection/service";
import { requireProfile } from "@/lib/auth/get-user";

export const metadata: Metadata = {
  title: "컬렉션",
  description:
    "회전목마를 돌리며 발견한 카드들을 모아두는 나만의 도감.",
};

/**
 * 카드 컬렉션 페이지.
 *
 * - 130 장 중 사용자가 지금까지 발견한 카드들의 진행도와 그리드를 표시한다.
 * - 별도 DB 테이블 없이 기존 사용자 데이터에서 발견 여부를 계산한다.
 */
export default async function CollectionPage() {
  const { profile } = await requireProfile();

  const discovered = await getDiscoveredCollection(profile.userId, profile);
  const ownedTotal =
    discovered.tarot.size +
    discovered.mbti.size +
    discovered.zodiac.size +
    discovered.chineseZodiac.size +
    discovered.cheongan.size +
    discovered.characters.size;

  const percent = Math.min(
    100,
    Math.round((ownedTotal / TOTAL_CARDS) * 100),
  );

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-mystic text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              내 컬렉션
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              회전목마를 돌리며 만난 카드들이 이곳에 모입니다.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mystic text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {ownedTotal}
              <span className="text-base font-normal text-muted-foreground">
                {" / "}
                {TOTAL_CARDS}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">소장 카드</p>
          </div>
        </div>

        {/* 진행 바 */}
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

      <CollectionView discovered={toPlain(discovered)} />
    </div>
  );
}
