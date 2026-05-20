/**
 * 점술사들의 이야기 — 캐릭터별 챕터 리더.
 *
 * 친밀도 레벨에 따라 풀려있는 챕터를 본문 + 일러스트로 보여준다.
 * 캐릭터 선택 화면(/chat) 에서는 한 줄 배너로만 광고하고, 본문은 여기서만 펼친다.
 */
import type { Metadata } from "next";

import { CharacterLoreCard } from "@/components/chat/character-lore-card";
import { requireProfile } from "@/lib/auth/get-user";
import { isAdmin } from "@/lib/auth/admin";
import { getAllAffinities } from "@/lib/affinity/service";

export const metadata: Metadata = {
  title: "점술사들의 이야기",
  description: "9 점술사 · 90 챕터의 세계관. 친밀도가 오르면 새 챕터가 풀려요.",
};

export default async function StoriesPage() {
  const { user, profile } = await requireProfile();
  const adminMode = isAdmin(user.email);
  const affinityRows = await getAllAffinities(profile.userId);
  const affinities = Object.fromEntries(
    affinityRows.map((a) => [a.characterId, a.points]),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          세계관 · LORE
        </p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight">
          점술사들의 이야기
        </h1>
        <p className="text-[15px] text-muted-foreground">
          친밀도가 오르면 새 챕터가 풀려요. 챕터 1은 누구든 펼쳐볼 수 있어요.
        </p>
      </header>

      <CharacterLoreCard affinities={affinities} adminMode={adminMode} />
    </div>
  );
}
