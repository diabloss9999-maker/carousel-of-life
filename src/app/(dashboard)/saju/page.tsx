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
import { IljinReading } from "@/components/saju/iljin-reading";
import {
  FiveElementsChart,
  type FiveElementsValue,
} from "@/components/saju/five-elements-chart";
import {
  SajuPillars,
  type SajuPillarsValue,
} from "@/components/saju/saju-pillars";
import { PageBg } from "@/components/layout/page-bg";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { asSajuDeepReading } from "@/lib/saju/deep-reading";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tPage = await getTranslations("sajuPage");
  return {
    title: tPage("metaTitle"),
    description: tPage("metaDescription"),
  };
}

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
  const t = await getTranslations("saju");
  const tPage = await getTranslations("sajuPage");

  const pillars = asPillars(profile.sajuPillars);
  const elements = asFiveElements(profile.fiveElements);
  const deepReading = asSajuDeepReading(profile.sajuDeepReading);
  const subscribed = await hasActiveSubscription(profile.userId);

  return (
    <div className="space-y-8">
      <PageBg src="/backgrounds/saju.webp" />
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </header>

      {pillars && elements ? (
        <div id="saju-results" className="contents">
          <IljinReading
            subscribed={subscribed}
            hasSaju={!!(pillars && elements)}
          />
          <SajuPillars pillars={pillars} />
          <FiveElementsChart elements={elements} />

          {/* 심층 분석 영역 */}
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
                {tPage("tipTitle")}
              </CardTitle>
              <CardDescription>
                {tPage("tipBody")}
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
              {t("noSajuTitle")}
            </CardTitle>
            <CardDescription>
              {t("noSajuDescription")}
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
