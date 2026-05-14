import type { Metadata } from "next";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { CharacterSelect } from "@/components/chat/character-select";
import { SessionDrawer } from "@/components/chat/session-drawer";
import { requireProfile } from "@/lib/auth/get-user";
import { isAdmin } from "@/lib/auth/admin";
import { listTodaySessions } from "@/lib/chat/service";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { getAllAffinities } from "@/lib/affinity/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { CharacterLoreCard } from "@/components/chat/character-lore-card";
import { WelcomeGreeting } from "@/components/chat/welcome-greeting";

export const metadata: Metadata = {
  title: "주술사",
  description: "사주를 아는 친구에게 궁금한 걸 물어봐요.",
};

export default async function ChatPage() {
  const { user, profile } = await requireProfile();
  const adminMode = isAdmin(user.email);

  const [sessions, usage, tier, affinityRows] = await Promise.all([
    listTodaySessions(profile.userId),
    getTodayUsage(profile.userId),
    getSubscriptionTier(profile.userId),
    getAllAffinities(profile.userId),
  ]);

  const affinities = Object.fromEntries(
    affinityRows.map((a) => [a.characterId, a.points]),
  );

  return (
    <div className="space-y-8">
      <WelcomeGreeting />
      <header className="space-y-3">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/whisper-hand.svg" alt="" aria-hidden className="h-8 w-8 opacity-60" />
          주술사
        </h1>
        <p className="text-muted-foreground">
          아홉 주술사 중 한 명을 골라. 이세계의 카드, 동양의 사주·천기, 북방의 룬 — 어느 결을 가진 자든 너의 운명을 이미 알고 있어.
        </p>
      </header>

      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
        tier={tier}
      />

      <CharacterLoreCard affinities={affinities} adminMode={adminMode} />

      <Card className="app-surface">
        <CardContent className="pt-5">
          <CharacterSelect affinities={affinities} />
        </CardContent>
      </Card>

      <SessionDrawer sessions={sessions} />
    </div>
  );
}
