import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 카드 풀이 타임아웃 방지. */
export const maxDuration = 30;

import { LenormandDrawForm } from "@/components/lenormand/lenormand-draw-form";
import { LenormandReadingCard } from "@/components/lenormand/lenormand-reading-card";
import { RuneDrawForm } from "@/components/runes/rune-draw-form";
import { RuneReadingCard } from "@/components/runes/rune-reading-card";
import { CardDivinationTabs } from "@/components/tarot/card-divination-tabs";
import { TarotDrawForm } from "@/components/tarot/tarot-draw-form";
import { TarotReadingCard } from "@/components/tarot/tarot-reading-card";
import { TarotThreeForm } from "@/components/tarot/tarot-three-form";
import { TarotThreeReadingCard } from "@/components/tarot/tarot-three-reading-card";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { PageBg } from "@/components/layout/page-bg";
import { requireProfile } from "@/lib/auth/get-user";
import { getTodayLenormandReadings } from "@/lib/lenormand/service";
import {
  getSubscriptionTier,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { getTodayRuneReadings } from "@/lib/runes/service";
import { getTodayTarotReadings } from "@/lib/tarot/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tPage = await getTranslations("tarotPage");
  return { title: tPage("metaTitle"), description: tPage("metaDescription") };
}

export default async function TarotPage() {
  const { profile } = await requireProfile();
  const tTarot = await getTranslations("tarot");
  const tPage = await getTranslations("tarotPage");

  const [readings, usage, subscribed, tier, lenormandReadings, runeReadings] =
    await Promise.all([
      getTodayTarotReadings(profile.userId),
      getTodayUsage(profile.userId),
      hasActiveSubscription(profile.userId),
      getSubscriptionTier(profile.userId),
      getTodayLenormandReadings(profile.userId),
      getTodayRuneReadings(profile.userId),
    ]);

  return (
    <div className="space-y-8">
      <PageBg src="/backgrounds/tarot.png" />
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          {tTarot("title")}
        </h1>
        <p className="text-muted-foreground">
          {tTarot("description")}
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

      <CardDivinationTabs
        tarotPanel={
          <div className="space-y-6">
            {/* 타로 유래 */}
            <div className="rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="font-mystic text-[15px] font-semibold text-amber-300/90">{tPage("tarotOrigin")}</p>
              <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {tPage("tarotOriginBody")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <TarotDrawForm />
              <TarotThreeForm subscribed={subscribed} />
            </div>

            {readings.length > 0 ? (
              <section id="tarot-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  {tPage("todaysTarot")}
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
            {/* 르노르망 유래 */}
            <div className="rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="font-mystic text-[15px] font-semibold text-amber-300/90">🌙 {tPage("lenormandOrigin")}</p>
              <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {tPage("lenormandOriginBody")}
              </p>
            </div>

            <LenormandDrawForm subscribed={subscribed} />

            {lenormandReadings.length > 0 ? (
              <section id="lenormand-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  {tPage("todaysLenormand")}
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
        runesPanel={
          <div className="space-y-6">
            {/* 룬 유래 */}
            <div className="rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="font-mystic text-[15px] font-semibold text-amber-300/90">
                ᚠ {tPage("runeOrigin")}
              </p>
              <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {tPage("runeOriginBody")}
              </p>
            </div>

            <RuneDrawForm subscribed={subscribed} />

            {runeReadings.length > 0 ? (
              <section id="rune-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  {tPage("todaysRune")}
                </h2>
                <div className="space-y-4">
                  {runeReadings.map((reading) => (
                    <RuneReadingCard key={reading.id} reading={reading} />
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
