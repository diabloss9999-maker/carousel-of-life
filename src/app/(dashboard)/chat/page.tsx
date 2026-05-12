import type { Metadata, Route } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { CharacterSelect } from "@/components/chat/character-select";
import { requireProfile } from "@/lib/auth/get-user";
import { listTodaySessions } from "@/lib/chat/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getAllAffinities } from "@/lib/affinity/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { formatKoreanDate } from "@/lib/utils";
import { CHARACTERS } from "@/lib/chat/characters";
import { CharacterLoreCard } from "@/components/chat/character-lore-card";

export const metadata: Metadata = {
  title: "주술사 문답",
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
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          주술사 문답
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

      {/* 캐릭터 선택 카드 */}
      <Card className="app-surface">
        <CardContent className="pt-5">
          <CharacterSelect affinities={affinities} />
        </CardContent>
      </Card>

      {/* 세계관 이야기 */}
      <CharacterLoreCard />

      {/* 오늘의 대화 목록 */}
      {sessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-mystic text-xl font-semibold tracking-tight">
            오늘의 대화
          </h2>
          <ul className="space-y-2">
            {sessions.map((s) => {
              const char = CHARACTERS[(s.character ?? "witch") as keyof typeof CHARACTERS];
              return (
                <li key={s.id}>
                  <Link
                    href={`/chat/${s.id}` as Route}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 px-4 py-3 hover:bg-card/70 transition-colors backdrop-blur"
                  >
                    <span className="text-lg">{char ? char.name : ""}</span>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <span className="font-mystic font-medium truncate">
                        {s.title}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatKoreanDate(new Date(s.lastMessageAt))}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
