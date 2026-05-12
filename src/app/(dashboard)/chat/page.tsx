import type { Metadata } from "next";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { CharacterSelect } from "@/components/chat/character-select";
import { SessionDrawer } from "@/components/chat/session-drawer";
import { requireProfile } from "@/lib/auth/get-user";
import { listTodaySessions } from "@/lib/chat/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getAllAffinities } from "@/lib/affinity/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { CharacterLoreCard } from "@/components/chat/character-lore-card";

export const metadata: Metadata = {
  title: "존재와의 조우",
  description: "사주를 아는 친구에게 궁금한 걸 물어봐요.",
};

export default async function ChatPage() {
  const { profile } = await requireProfile();

  const [sessions, usage, subscribed, affinityRows] = await Promise.all([
    listTodaySessions(profile.userId),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
    getAllAffinities(profile.userId),
  ]);

  const affinities = Object.fromEntries(
    affinityRows.map((a) => [a.characterId, a.points]),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/whisper-hand.svg" alt="" aria-hidden className="h-8 w-8 opacity-60" />
          존재와의 조우
        </h1>
        <p className="text-muted-foreground">
          여섯 주술사 중 한 명을 골라. 이세계든 동양이든, 그들은 이미 당신의 사주를 알고 있어.
        </p>
      </header>

      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
        subscribed={subscribed}
      />

      <CharacterLoreCard />

      <Card className="app-surface">
        <CardContent className="pt-5">
          <CharacterSelect affinities={affinities} />
        </CardContent>
      </Card>

      <SessionDrawer sessions={sessions} />
    </div>
  );
}
