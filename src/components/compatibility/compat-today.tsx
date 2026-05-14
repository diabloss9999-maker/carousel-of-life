"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  Loader2,
  Lock,
  MessageCircle,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCompatTodayAction,
  type CompatTodayState,
} from "@/app/(dashboard)/compatibility/actions";
import type { CompatTodayOutput } from "@/lib/ai/types";

interface CompatTodayProps {
  subscribed: boolean;
  aName: string;
  bName: string;
  compatScore: number;
  aMbti?: string;
  bMbti?: string;
}

export function CompatToday(props: CompatTodayProps) {
  const { subscribed } = props;
  const [data, setData] = useState<CompatTodayOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("compatToday");
  const tPrem = useTranslations("premiumCard");

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CompatTodayState = await generateCompatTodayAction(
        props.aName,
        props.bName,
        props.compatScore,
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
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-accent" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={
              data.isGoodDay
                ? "flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 p-3"
                : "flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
            }
          >
            {data.isGoodDay ? (
              <Check className="h-5 w-5 text-accent" />
            ) : (
              <X className="h-5 w-5 text-destructive" />
            )}
            <p className="font-mystic text-sm font-semibold">
              {data.isGoodDay ? t("goodDay") : t("notGoodDay")}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("approach")}
            </p>
            <p className="font-mystic leading-relaxed">{data.approach}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {t("messageIdea")}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">
                {data.messageIdea}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                {t("caution")}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">{data.caution}</p>
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
          <Calendar className="h-4 w-4 text-accent" />
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
