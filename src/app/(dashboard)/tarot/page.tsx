import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 카드 풀이 타임아웃 방지. */
export const maxDuration = 30;

import { LenormandDrawForm } from "@/components/lenormand/lenormand-draw-form";
import { LenormandReadingCard } from "@/components/lenormand/lenormand-reading-card";
import { CardDivinationTabs } from "@/components/tarot/card-divination-tabs";
import { TarotDrawForm } from "@/components/tarot/tarot-draw-form";
import { TarotReadingCard } from "@/components/tarot/tarot-reading-card";
import { TarotThreeForm } from "@/components/tarot/tarot-three-form";
import { TarotThreeReadingCard } from "@/components/tarot/tarot-three-reading-card";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { requireProfile } from "@/lib/auth/get-user";
import { getTodayLenormandReadings } from "@/lib/lenormand/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getTodayTarotReadings } from "@/lib/tarot/service";
import { getTodayUsage } from "@/lib/usage/quota";

export const metadata: Metadata = {
  title: "카드의 계시",
  description: "타로·르노르망 카드를 뽑아 운명의 한 자락을 살펴봐요.",
};

export default async function TarotPage() {
  const { profile } = await requireProfile();

  const [readings, usage, subscribed, lenormandReadings] = await Promise.all([
    getTodayTarotReadings(profile.userId),
    getTodayUsage(profile.userId),
    hasActiveSubscription(profile.userId),
    getTodayLenormandReadings(profile.userId),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          카드의 계시
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

      <CardDivinationTabs
        tarotPanel={
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <TarotDrawForm />
              <TarotThreeForm subscribed={subscribed} />
            </div>

            {readings.length > 0 ? (
              <section id="tarot-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  오늘 본 카드
                </h2>
                <div className="space-y-6">
                  {readings.map((reading) =>
                    reading.spreadType === "three" ? (
                      <TarotThreeReadingCard
                        key={reading.id}
                        reading={reading}
                      />
                    ) : (
                      <TarotReadingCard key={reading.id} reading={reading} />
                    ),
                  )}
                </div>
              </section>
            ) : null}
          </div>
        }
        lenormandPanel={
          <div className="space-y-6">
            <LenormandDrawForm />

            {lenormandReadings.length > 0 ? (
              <section id="lenormand-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  오늘 뽑은 카드
                </h2>
                <div className="space-y-4">
                  {lenormandReadings.map((reading) => (
                    <LenormandReadingCard
                      key={reading.id}
                      reading={reading}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
