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
import { requireProfile } from "@/lib/auth/get-user";
import { getTodayLenormandReadings } from "@/lib/lenormand/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getTodayRuneReadings } from "@/lib/runes/service";
import { getTodayTarotReadings } from "@/lib/tarot/service";
import { getTodayUsage } from "@/lib/usage/quota";

export const metadata: Metadata = {
  title: "카드의 계시",
  description: "타로·르노르망 카드를 뽑아 운명의 한 자락을 살펴봐요.",
};

export default async function TarotPage() {
  const { profile } = await requireProfile();

  const [readings, usage, subscribed, lenormandReadings, runeReadings] =
    await Promise.all([
      getTodayTarotReadings(profile.userId),
      getTodayUsage(profile.userId),
      hasActiveSubscription(profile.userId),
      getTodayLenormandReadings(profile.userId),
      getTodayRuneReadings(profile.userId),
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
            {/* 타로 유래 */}
            <div className="rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="font-mystic text-sm font-semibold text-amber-300/90">🃏 타로의 기원</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                15세기 이탈리아 귀족들의 카드 게임 「트리온피」에서 시작된 타로는, 18세기 유럽 신비주의자들에 의해 점술 도구로 재탄생했습니다.
                1910년 아서 에드워드 웨이트와 화가 파멜라 콜먼 스미스가 완성한 라이더-웨이트 덱이 오늘날 타로의 표준이 되었습니다.
                78장의 카드는 메이저 아르카나 22장(인생의 큰 흐름)과 마이너 아르카나 56장(일상의 세세한 이야기)으로 이루어져 있으며,
                각 카드는 단순한 그림이 아니라 인간 내면의 원형적 에너지를 상징합니다.
              </p>
            </div>

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
            {/* 르노르망 유래 */}
            <div className="rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="font-mystic text-sm font-semibold text-amber-300/90">🌙 르노르망의 기원</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                나폴레옹의 황후 조세핀과 수많은 귀족들의 운명을 읽었던 전설적인 점술사, 마리 안 르노르망(1768~1843).
                그녀의 이름을 딴 르노르망 카드는 타로보다 단순하고 직설적인 36장의 카드로 구성되어 있습니다.
                각 카드는 기수·별·하트처럼 일상에서 친숙한 이미지를 담고 있으며, 카드 한 장의 의미보다
                인접한 카드들의 조합이 말하는 이야기를 읽는 것이 핵심입니다.
                타로가 내면의 심리를 탐구한다면, 르노르망은 현실의 흐름을 직접적으로 짚어냅니다.
              </p>
            </div>

            <LenormandDrawForm subscribed={subscribed} />

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
        runesPanel={
          <div className="space-y-6">
            {/* 룬 유래 */}
            <div className="rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="font-mystic text-sm font-semibold text-amber-300/90">
                ᚠ 룬의 기원
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                엘더 푸타르크(Elder Futhark)는 가장 오래된 룬 문자 체계로,
                북유럽 게르만 민족이 기원후 150~800년 사이에 사용했습니다.
                24개의 룬은 단순한 문자가 아니라 각각 우주적 힘과 신성한 원리를
                상징합니다. 바이킹 전사들은 룬을 방패에 새겨 보호를 구했고,
                시인들은 오딘이 세계수 이그드라실에 거꾸로 매달려 9일 동안 희생
                끝에 룬의 지혜를 얻었다고 노래했습니다. 현재는 북유럽 신비주의
                전통에서 점술·명상·자기 탐구의 도구로 사용됩니다.
              </p>
            </div>

            <RuneDrawForm subscribed={subscribed} />

            {runeReadings.length > 0 ? (
              <section id="rune-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  오늘 던진 룬
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
