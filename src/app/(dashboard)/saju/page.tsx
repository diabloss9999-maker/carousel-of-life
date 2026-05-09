import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalculateSajuButton } from "@/components/saju/calculate-saju-button";
import { ResetSajuButton } from "@/components/saju/reset-saju-button";
import { DeepReadingButton } from "@/components/saju/deep-reading-button";
import { DeepReadingCard } from "@/components/saju/deep-reading-card";
import {
  FiveElementsChart,
  type FiveElementsValue,
} from "@/components/saju/five-elements-chart";
import {
  SajuPillars,
  type SajuPillarsValue,
} from "@/components/saju/saju-pillars";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { asSajuDeepReading } from "@/lib/saju/deep-reading";

export const metadata: Metadata = {
  title: "사주팔자",
  description: "여덟 글자 안에 새겨진 타고난 기운을 살펴봐요.",
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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          내 사주팔자
        </h1>
        <p className="text-muted-foreground">
          여덟 글자에 새겨진 타고난 기운을 살펴봐요.
        </p>
      </header>

      {pillars && elements ? (
        <div id="saju-results" className="contents">
          <SajuPillars pillars={pillars} />
          <FiveElementsChart elements={elements} />

          {/* 심층 분석 영역 */}
          {deepReading ? (
            <DeepReadingCard reading={deepReading} />
          ) : (
            <DeepReadingButton locked={!subscribed} />
          )}

          <Card className="app-surface">
            <CardHeader>
              <CardTitle className="font-mystic text-lg">
                기억해두면 좋은 것
              </CardTitle>
              <CardDescription>
                사주는 정해진 운명이 아니라 흐름이에요. 강한 기운은 살리고, 약한
                기운은 보충하면서 살면 결이 한결 부드러워져요.
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
              사주를 아직 보지 않았어
            </CardTitle>
            <CardDescription>
              한 번 살펴보면 운세 풀이가 한결 깊어져요. 처음 한 번만 계산하면
              계속 저장돼요.
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
