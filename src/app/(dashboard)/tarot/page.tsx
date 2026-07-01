import type { Metadata } from "next";

export const maxDuration = 60;

import { Layers3, LockKeyhole, MessageSquareText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RelatableReadingCard } from "@/components/shared/relatable-reading-card";
import { CardDivinationTabs } from "@/components/tarot/card-divination-tabs";
import type { TarotReader } from "@/components/tarot/reader";
import { TarotModeSwitch } from "@/components/tarot/tarot-mode-switch";
import { TarotReadingCard } from "@/components/tarot/tarot-reading-card";
import { TarotSevenReadingCard } from "@/components/tarot/tarot-seven-reading-card";
import { TarotThreeReadingCard } from "@/components/tarot/tarot-three-reading-card";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getSubscriptionTier,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { getTodayTarotReadings } from "@/lib/tarot/service";

export const metadata: Metadata = {
  title: "타로",
  description:
    "카드 한 장 또는 과거, 현재, 미래 3장 흐름으로 지금의 선택을 정리해요.",
};

export default async function TarotPage() {
  const { profile } = await requireProfile();
  const tarotReader: TarotReader = {
    id: "runeshaman",
    name: "타로 리딩",
    role: "Card Reading",
    avatarSrc: "/tarot/card_back.webp",
    tarotImageSrc: "/backgrounds/tarot.webp",
    label: "Tarot Reading",
    line: "",
    voiceGuide: "",
  };

  const [readings, subscribed, tier] = await Promise.all([
    getTodayTarotReadings(profile.userId),
    hasActiveSubscription(profile.userId).catch(() => false),
    getSubscriptionTier(profile.userId).catch(() => "free" as const),
  ]);
  const singleReadings = readings.filter(
    (reading) =>
      reading.spreadType !== "three" && reading.spreadType !== "seven",
  );
  const threeReadings = readings.filter(
    (reading) => reading.spreadType === "three",
  );
  const sevenReadings = readings.filter(
    (reading) => reading.spreadType === "seven",
  );
  const latestSevenReading = sevenReadings[0];
  const olderSevenReadings = sevenReadings.slice(1);
  const latestThreeReading = threeReadings[0];
  const olderThreeReadings = threeReadings.slice(1);
  const latestSingleReading = singleReadings[0];
  const olderSingleReadings = singleReadings.slice(1);

  return (
    <div className="reading-page mx-auto w-full space-y-8">
      <header className="reading-hero space-y-2">
        <p className="reading-kicker">Tarot Reading</p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          타로
        </h1>
        <p className="text-muted-foreground">
          지금 마음에 걸리는 선택을 카드 흐름으로 차분히 정리해요.
        </p>
      </header>

      <RelatableReadingCard kind="tarot" />

      <TarotStartGuide subscribed={subscribed} />

      <div className="mx-auto max-w-2xl">
        <TarotModeSwitch
          oneCardReader={tarotReader}
          threeCardReader={tarotReader}
          subscribed={subscribed}
          tier={tier}
        />
      </div>

      <CardDivinationTabs
        tarotPanel={
          <div className="space-y-6">
            <div className="reading-guide-tile space-y-2">
              <p className="font-mystic text-[15px] font-semibold text-amber-300/90">
                타로는 정답보다 방향을 보는 도구예요
              </p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                카드는 미래를 단정하기보다, 지금 마음이 어디에 걸려 있는지
                보여줘요. 결과는 오늘의 선택을 더 선명하게 만드는 참고로
                읽어주세요.
              </p>
            </div>

            {latestSevenReading ? (
              <section id="tarot-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  7장 프로 전략 타로
                </h2>
                <div className="space-y-6">
                  <TarotSevenReadingCard
                    key={latestSevenReading.id}
                    reading={latestSevenReading}
                  />
                  {olderSevenReadings.length > 0 ? (
                    <details className="group app-surface rounded-[18px] px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                        <span>이전 7장 프로 타로 {olderSevenReadings.length}개</span>
                        <span className="text-muted-foreground transition group-open:rotate-180">
                          ↓
                        </span>
                      </summary>
                      <div className="mt-4 space-y-6">
                        {olderSevenReadings.map((reading) => (
                          <TarotSevenReadingCard
                            key={reading.id}
                            reading={reading}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </section>
            ) : null}

            {latestThreeReading ? (
              <section
                id={latestSevenReading ? undefined : "tarot-results"}
                className="space-y-4"
              >
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  3장 타로
                </h2>
                <div className="space-y-6">
                  <TarotThreeReadingCard
                    key={latestThreeReading.id}
                    reading={latestThreeReading}
                  />
                  {olderThreeReadings.length > 0 ? (
                    <details className="group app-surface rounded-[18px] px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                        <span>이전 3장 타로 {olderThreeReadings.length}개</span>
                        <span className="text-muted-foreground transition group-open:rotate-180">
                          ↓
                        </span>
                      </summary>
                      <div className="mt-4 space-y-6">
                        {olderThreeReadings.map((reading) => (
                          <TarotThreeReadingCard
                            key={reading.id}
                            reading={reading}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </section>
            ) : null}

            {latestSingleReading ? (
              <section
                id={
                  latestSevenReading || latestThreeReading
                    ? undefined
                    : "tarot-results"
                }
                className="space-y-4"
              >
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  오늘 뽑은 카드
                </h2>
                <div className="space-y-6">
                  <TarotReadingCard
                    key={latestSingleReading.id}
                    reading={latestSingleReading}
                    subscribed={subscribed}
                  />
                  {olderSingleReadings.length > 0 ? (
                    <details className="group app-surface rounded-[18px] px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                        <span>이전 한 장 타로 {olderSingleReadings.length}개</span>
                        <span className="text-muted-foreground transition group-open:rotate-180">
                          ↓
                        </span>
                      </summary>
                      <div className="mt-4 space-y-6">
                        {olderSingleReadings.map((reading) => (
                          <TarotReadingCard
                            key={reading.id}
                            reading={reading}
                            subscribed={subscribed}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

function TarotStartGuide({ subscribed }: { subscribed: boolean }) {
  return (
    <section className="grid gap-2 sm:grid-cols-3">
      <GuideTile
        icon={Sparkles}
        title="한 장 리딩"
        body="지금 마음에 걸리는 질문 하나를 빠르게 정리해요."
      />
      <GuideTile
        icon={Layers3}
        title="3장 리딩"
        body={
          subscribed
            ? "과거, 현재, 미래를 차례로 뒤집어 흐름을 봐요."
            : "라이트 이상에서 과거, 현재, 미래 3장 리딩이 열려요."
        }
      />
      <GuideTile
        icon={subscribed ? MessageSquareText : LockKeyhole}
        title={subscribed ? "질문 확장" : "라이트 잠금"}
        body={
          subscribed
            ? "상황과 선택지를 구체적으로 넣을수록 더 선명해져요."
            : "구독하면 더 깊은 카드 흐름을 볼 수 있어요."
        }
      />
    </section>
  );
}

function GuideTile({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="reading-guide-tile">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[13px] font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
