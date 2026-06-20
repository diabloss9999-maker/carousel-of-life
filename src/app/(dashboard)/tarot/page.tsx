import type { Metadata } from "next";

export const maxDuration = 30;

import { Layers3, LockKeyhole, MessageSquareText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RelatableReadingCard } from "@/components/shared/relatable-reading-card";
import { CardDivinationTabs } from "@/components/tarot/card-divination-tabs";
import type { TarotReader } from "@/components/tarot/reader";
import { TarotModeSwitch } from "@/components/tarot/tarot-mode-switch";
import { TarotReadingCard } from "@/components/tarot/tarot-reading-card";
import { TarotThreeReadingCard } from "@/components/tarot/tarot-three-reading-card";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
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

  const [readings, subscribed] = await Promise.all([
    getTodayTarotReadings(profile.userId),
    hasActiveSubscription(profile.userId).catch(() => false),
  ]);
  const singleReadings = readings.filter(
    (reading) => reading.spreadType !== "three",
  );
  const threeReadings = readings.filter(
    (reading) => reading.spreadType === "three",
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
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
        />
      </div>

      <CardDivinationTabs
        tarotPanel={
          <div className="space-y-6">
            <div className="space-y-2 rounded-2xl border border-amber-200/20 bg-amber-50/5 px-5 py-4 backdrop-blur-sm">
              <p className="font-mystic text-[15px] font-semibold text-amber-300/90">
                타로는 정답보다 방향을 보는 도구예요
              </p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                카드는 미래를 단정하기보다, 지금 마음이 어디에 걸려 있는지
                보여줘요. 결과는 오늘의 선택을 더 선명하게 만드는 참고로
                읽어주세요.
              </p>
            </div>

            {singleReadings.length > 0 ? (
              <section id="tarot-results" className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  오늘 뽑은 카드
                </h2>
                <div className="space-y-6">
                  {singleReadings.map((reading) => (
                    <TarotReadingCard
                      key={reading.id}
                      reading={reading}
                      subscribed={subscribed}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {threeReadings.length > 0 ? (
              <section className="space-y-4">
                <h2 className="font-mystic text-2xl font-semibold tracking-tight">
                  3장 타로
                </h2>
                <div className="space-y-6">
                  {threeReadings.map((reading) => (
                    <TarotThreeReadingCard
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
            : "멤버십에서 더 깊은 카드 흐름을 볼 수 있어요."
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[13px] font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
