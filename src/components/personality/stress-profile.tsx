"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  HeartPulse,
  Loader2,
  Lock,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateStressProfileAction,
  type StressProfileState,
} from "@/app/(dashboard)/personality/actions";
import type { StressProfileOutput } from "@/lib/ai/types";

interface StressProfileProps {
  subscribed: boolean;
}

export function StressProfile({ subscribed }: StressProfileProps) {
  const [data, setData] = useState<StressProfileOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const didAutoLoadRef = useRef(false);
  const t = useTranslations("stressProfile");
  const tPrem = useTranslations("premiumCard");

  useEffect(() => {
    if (!subscribed || didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;
    startTransition(async () => {
      const result: StressProfileState = await generateStressProfileAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      }
    });
  }, [subscribed]);

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: StressProfileState = await generateStressProfileAction();
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
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[15px] font-medium text-primary">
              {tPrem("lightBadge")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            {lockBullets.map((line) => (
              <p key={line} className="text-[15px]">{line}</p>
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
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <HeartPulse className="h-4 w-4 text-accent" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-[15px] font-semibold text-destructive uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> {t("triggers")}
            </p>
            <ul className="space-y-2">
              {data.triggers.map((trigger, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px]">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[15px] font-bold text-destructive">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{trigger}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t("collapsePattern")}
            </p>
            <p className="font-mystic leading-relaxed">
              {data.collapsePattern}
            </p>
          </div>

          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-2">
            <p className="text-[15px] font-semibold text-accent uppercase tracking-wide">
              {t("recoveryTips")}
            </p>
            <ol className="space-y-2">
              {data.recoveryTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px]">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-[15px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-primary uppercase tracking-wide">
                {t("warningSign")}
              </p>
              <p className="mt-0.5 text-[15px] leading-relaxed">
                {data.warningSign}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <HeartPulse className="h-4 w-4 text-accent" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[15px] text-muted-foreground">
          {t("lockBody")}
        </p>
        {errorMsg ? (
          <p className="text-[15px] text-destructive">{errorMsg}</p>
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
