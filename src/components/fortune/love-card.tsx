"use client";

/**
 * 오늘의 사랑 리포트 — 라이트 전용 카드.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES } from "@/lib/constants";
import {
  generateLovePremiumAction,
  type LovePremiumState,
} from "@/app/(dashboard)/today/actions";
import type { LovePremiumOutput } from "@/lib/ai/types";

interface LoveCardProps {
  fortune: DailyFortune;
  subscribed: boolean;
}

export function LoveCard({ subscribed }: LoveCardProps) {
  const [data, setData] = useState<LovePremiumOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("loveReport");
  const tPrem = useTranslations("premiumCard");

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: LovePremiumState = await generateLovePremiumAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      } else {
        setErrorMsg(result.message ?? tPrem("genericError"));
      }
    });
  };

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
            <p className="text-[15px]">{t("lockBullet1")}</p>
            <p className="text-[15px]">{t("lockBullet2")}</p>
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
            <Heart className="h-4 w-4 text-accent" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 오늘의 한마디 */}
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-2">
            <p className="text-[15px] font-semibold text-accent uppercase tracking-wide">
              {t("todayLine")}
            </p>
            <p className="font-mystic text-base leading-relaxed">
              {data.message.text}
            </p>
            <p className="text-[15px] text-muted-foreground">
              {data.message.situation}
            </p>
          </div>

          {/* 매력 팁 3가지 */}
          <div className="space-y-3">
            <p className="text-[15px] font-semibold text-primary uppercase tracking-wide">
              {t("charmTip")}
            </p>
            <ol className="space-y-3">
              {data.charmTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-[15px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-mystic text-[15px] font-semibold">
                      {tip.title}
                    </p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-accent" />
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
              {t("loadingShort")}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {tPrem("getReport")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
