import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 타로 풀이 타임아웃 방지. */
export const maxDuration = 30;

import { TarotDrawForm } from "@/components/tarot/tarot-draw-form";
import { TarotReadingCard } from "@/components/tarot/tarot-reading-card";
import { TarotThreeForm } from "@/components/tarot/tarot-three-form";
import { TarotThreeReadingCard } from "@/components/tarot/tarot-three-reading-card";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getTodayTarotReadings } from "@/lib/tarot/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { QuotaBar } from "@/components/fortune/quota-bar";

export const metadata: Metadata = {
  title: "타로 카드",
  description: "카드를 뽑아 운명의 한 자락을 살펴봐요.",
};

export default async function TarotPage() {
  const { profile } = await requireProfile();

  const [readings, usage, subscribed] = await Promise.all([
    getTodayTarotReadings(profile.userId),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          타로의 계시
        </h1>
        <p className="text-muted-foreground">
          카드를 뽑아 운명의 한 자락을 살펴봐요.
        </p>
      </header>

      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
        subscribed={subscribed}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <TarotDrawForm />
        <TarotThreeForm subscribed={subscribed} />
      </div>

      {readings.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-mystic text-2xl font-semibold tracking-tight">
            오늘 본 카드
          </h2>
          <div className="space-y-6">
            {readings.map((reading) =>
              reading.spreadType === "three" ? (
                <TarotThreeReadingCard key={reading.id} reading={reading} />
              ) : (
                <TarotReadingCard key={reading.id} reading={reading} />
              ),
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
