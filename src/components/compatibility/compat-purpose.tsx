"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Lock, Sparkles, Target } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCompatPurposeAction,
  type CompatPurposeState,
} from "@/app/(dashboard)/compatibility/actions";
import type { CompatPurposeOutput } from "@/lib/ai/types";

interface CompatPurposeProps {
  subscribed: boolean;
  aName: string;
  aBirthDate: string;
  bName: string;
  bBirthDate: string;
  aMbti?: string;
  bMbti?: string;
}

const PURPOSE_TKEY = {
  romance: "labelRomance",
  marriage: "labelMarriage",
  business: "labelBusiness",
  friendship: "labelFriendship",
} as const;

export function CompatPurpose(props: CompatPurposeProps) {
  const { subscribed } = props;
  const [data, setData] = useState<CompatPurposeOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("compatPurpose");
  const tPrem = useTranslations("premiumCard");

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CompatPurposeState = await generateCompatPurposeAction(
        props.aName,
        props.aBirthDate,
        props.bName,
        props.bBirthDate,
        props.aMbti,
        props.bMbti,
      );
      if (result.kind === "success" && result.data) {
        setData(result.data);
      } else {
        setErrorMsg(result.message ?? tPrem("genericError"));
      }
    });
  };

  const lockBullets = t.raw("lockBullets") as string[];

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" />
            {t("title")}
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              {tPrem("lightBadge")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            {lockBullets.map((line) => (
              <p key={line} className="text-sm">{line}</p>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" />
              {tPrem("verifyCta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (data) {
    const items: Array<{ key: keyof typeof PURPOSE_TKEY; score: number }> = [
      { key: "romance", score: data.romance },
      { key: "marriage", score: data.marriage },
      { key: "business", score: data.business },
      { key: "friendship", score: data.friendship },
    ];

    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            {items.map((item) => (
              <PurposeGauge
                key={item.key}
                label={t(PURPOSE_TKEY[item.key] as "labelRomance" | "labelMarriage" | "labelBusiness" | "labelFriendship")}
                score={item.score}
              />
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/25 bg-accent/5 p-3">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                {t("bestKey")}
              </p>
              <p className="mt-1 font-mystic text-sm font-semibold">
                {data.bestPurpose}
              </p>
            </div>
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                {t("worstKey")}
              </p>
              <p className="mt-1 font-mystic text-sm font-semibold">
                {data.worstPurpose}
              </p>
            </div>
          </div>

          <p className="font-mystic leading-relaxed text-foreground/85">
            {data.summary}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-accent" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("lockBody")}
        </p>
        {errorMsg ? (
          <p className="text-xs text-destructive">{errorMsg}</p>
        ) : null}
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("analyzing")}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {t("getCta")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function PurposeGauge({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const gaugeStyle = { "--gauge": `${clamped}%` } as React.CSSProperties;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mystic font-medium">{label}</span>
        <span className="font-mystic font-semibold">{clamped} / 100</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-card"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        style={gaugeStyle}
      >
        <div className="h-full w-[var(--gauge)] rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-700 ease-out" />
      </div>
    </div>
  );
}
