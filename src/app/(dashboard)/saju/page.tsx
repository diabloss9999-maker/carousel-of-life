import type { Metadata } from "next";

import {
  ChartNoAxesColumn,
  LockKeyhole,
  ScrollText,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RelatableReadingCard } from "@/components/shared/relatable-reading-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalculateSajuButton } from "@/components/saju/calculate-saju-button";
import { DeepReadingButton } from "@/components/saju/deep-reading-button";
import { DeepReadingCard } from "@/components/saju/deep-reading-card";
import {
  FiveElementsChart,
  type FiveElementsValue,
} from "@/components/saju/five-elements-chart";
import { IljinReading } from "@/components/saju/iljin-reading";
import { ResetSajuButton } from "@/components/saju/reset-saju-button";
import { SajuPillars, type SajuPillarsValue } from "@/components/saju/saju-pillars";
import { SajuReadingSummary } from "@/components/saju/saju-reading-summary";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { asSajuDeepReading } from "@/lib/saju/deep-reading";

export const metadata: Metadata = {
  title: "사주",
  description:
    "생년월일과 태어난 시간을 바탕으로 기질, 오행 균형, 오늘의 흐름을 정리해요.",
};

function asPillars(v: unknown): SajuPillarsValue | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    !isPillar(o.year) ||
    !isPillar(o.month) ||
    !isPillar(o.day) ||
    !(o.hour === null || isPillar(o.hour))
  ) {
    return null;
  }
  return {
    year: o.year as { stem: string; branch: string },
    month: o.month as { stem: string; branch: string },
    day: o.day as { stem: string; branch: string },
    hour: (o.hour as { stem: string; branch: string }) ?? null,
  };
}

function isPillar(v: unknown): v is { stem: string; branch: string } {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.stem === "string" && typeof o.branch === "string";
}

function asFiveElements(v: unknown): FiveElementsValue | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const keys: Array<keyof FiveElementsValue> = [
    "wood",
    "fire",
    "earth",
    "metal",
    "water",
  ];
  if (!keys.every((k) => typeof o[k] === "number")) return null;
  return {
    wood: o.wood as number,
    fire: o.fire as number,
    earth: o.earth as number,
    metal: o.metal as number,
    water: o.water as number,
  };
}

export default async function SajuPage() {
  const { profile } = await requireProfile();

  const pillars = asPillars(profile.sajuPillars);
  const elements = asFiveElements(profile.fiveElements);
  const deepReading = asSajuDeepReading(profile.sajuDeepReading);
  const subscribed = await hasActiveSubscription(profile.userId);
  const hasSaju = !!(pillars && elements);

  return (
    <div className="reading-page mx-auto w-full space-y-8">
      <header className="reading-hero space-y-2">
        <p className="reading-kicker">Saju Reading</p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          사주
        </h1>
        <p className="text-muted-foreground">
          태어난 정보로 내 기본 기질과 오행 균형, 오늘의 흐름을 살펴봐요.
        </p>
      </header>

      <RelatableReadingCard kind="saju" />

      <SajuStartGuide
        hasSaju={hasSaju}
        hasDeepReading={!!deepReading}
        subscribed={subscribed}
      />

      {pillars && elements ? (
        <div id="saju-results" className="contents">
          <IljinReading subscribed={subscribed} hasSaju={hasSaju} />

          <SajuReadingSummary
            pillars={pillars}
            elements={elements}
            hasDeepReading={!!deepReading}
            subscribed={subscribed}
          />

          <SajuPillars pillars={pillars} />
          <FiveElementsChart elements={elements} />

          {deepReading ? (
            <div id="saju-deep-result">
              <DeepReadingCard reading={deepReading} />
            </div>
          ) : (
            <DeepReadingButton locked={!subscribed} />
          )}

          <Card className="app-surface">
            <CardHeader>
              <CardTitle className="font-mystic text-lg">
                사주 정보 다시 계산하기
              </CardTitle>
              <CardDescription>
                생년월일이나 태어난 시간을 바꿨다면 다시 계산할 수 있어요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetSajuButton />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="font-mystic text-xl">
              아직 사주를 계산하지 않았어요
            </CardTitle>
            <CardDescription>
              처음 한 번만 계산하면 명식, 오행 균형, 심층 해석의 기준을
              만들 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalculateSajuButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SajuStartGuide({
  hasDeepReading,
  hasSaju,
  subscribed,
}: {
  hasDeepReading: boolean;
  hasSaju: boolean;
  subscribed: boolean;
}) {
  return (
    <section className="grid gap-2 sm:grid-cols-3">
      <GuideTile
        icon={ScrollText}
        title="사주 명식"
        body={
          hasSaju
            ? "내 기본 기질과 흐름의 뼈대를 먼저 보여줘요."
            : "생년월일로 기본 구조를 계산해요."
        }
      />
      <GuideTile
        icon={ChartNoAxesColumn}
        title="오행 균형"
        body={
          hasSaju
            ? "강한 기운과 부족한 기운을 시각적으로 확인해요."
            : "나에게 치우친 기운을 보기 쉽게 정리해요."
        }
      />
      <GuideTile
        icon={hasDeepReading ? Sparkles : LockKeyhole}
        title={hasDeepReading ? "심층 해석 완료" : "심층 해석"}
        body={
          hasDeepReading
            ? "기질, 관계, 돈, 일의 방향까지 이어서 볼 수 있어요."
            : subscribed
              ? "계산 후 심층 해석까지 바로 생성할 수 있어요."
              : "구독하면 더 구체적인 해석이 열려요."
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
