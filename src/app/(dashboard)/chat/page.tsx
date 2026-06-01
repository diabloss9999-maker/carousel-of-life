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
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { getAllAffinities } from "@/lib/affinity/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { WorldTeaserBanner } from "@/components/chat/world-teaser-banner";
import { WelcomeGreeting } from "@/components/chat/welcome-greeting";
import { getTodayCharacterVacations } from "@/lib/chat/character-vacation";
import { buildMatchScoreMap } from "@/lib/chat/character-match";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "점술사",
  description: "사주를 아는 친구에게 궁금한 걸 물어봐요.",
};

export default async function ChatPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("chat");

  const [sessions, usage, tier, affinityRows] = await Promise.all([
    listTodaySessions(profile.userId),
    getTodayUsage(profile.userId),
    getSubscriptionTier(profile.userId),
    getAllAffinities(profile.userId),
  ]);

  const affinities = Object.fromEntries(
    affinityRows.map((a) => [a.characterId, a.points]),
  );
  const vacationRoster = getTodayCharacterVacations();
  // 유저 MBTI 기준 캐릭터 궁합 점수 (MBTI 없으면 null → 배지 미표시)
  const matchScores = buildMatchScoreMap(profile.mbti);

  return (
    <div className="space-y-8">
      <WelcomeGreeting />
      <header className="space-y-3">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl flex items-center gap-3">
          <img src="/icons/whisper-hand.svg" alt="" aria-hidden className="h-8 w-8 opacity-60" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <div className="rounded-2xl ring-1 ring-primary/25 shadow-lg shadow-primary/5">
        <QuotaBar
          fortuneCount={usage.fortuneCount}
          tarotCount={usage.tarotCount}
          chatCount={usage.chatCount}
          tier={tier}
        />
      </div>

      <WorldTeaserBanner />

      <Card className="app-surface">
        <CardContent className="pt-5">
          <CharacterSelect
            affinities={affinities}
            vacationRoster={vacationRoster}
            matchScores={matchScores}
          />
        </CardContent>
      </Card>

      <SessionDrawer sessions={sessions} />
    </div>
  );
}
