"use client";

/**
 * 유형 라이트 F — 직업 적성 심층 리포트 카드.
 */
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  CircleSlash,
  Loader2,
  Lock,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCareerFitAction,
  type CareerFitState,
} from "@/app/(dashboard)/personality/actions";
import type { CareerFitOutput } from "@/lib/ai/types";

interface CareerFitProps {
  subscribed: boolean;
}

export function CareerFit({ subscribed }: CareerFitProps) {
  const [data, setData] = useState<CareerFitOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const didAutoLoadRef = useRef(false);
  const t = useTranslations("careerFit");
  const tPrem = useTranslations("premiumCard");

  useEffect(() => {
    if (!subscribed || didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;
    startTransition(async () => {
      const result: CareerFitState = await generateCareerFitAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      }
    });
  }, [subscribed]);

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CareerFitState = await generateCareerFitAction();
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
            <Briefcase className="h-4 w-4 text-accent" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-1.5">
            <p className="text-[15px] font-semibold text-accent uppercase tracking-wide flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5" /> {t("bestEnvironment")}
            </p>
            <p className="font-mystic leading-relaxed">
              {data.bestEnvironment}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t("fitRoles")}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.fitRoles.map((role, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/15 px-3 py-1 text-[15px] font-medium text-primary"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <CircleSlash className="h-4 w-4 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-destructive uppercase tracking-wide">
                {t("avoidEnvironments")}
              </p>
              <p className="mt-0.5 text-[15px] leading-relaxed">
                {data.avoidEnvironments}
              </p>
            </div>
          </div>

          <div className="rounded-xl app-surface p-4 space-y-1.5">
            <p className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t("workStyle")}
            </p>
            <p className="font-mystic leading-relaxed">{data.workStyle}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <TrendingUp className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-primary uppercase tracking-wide">
                {t("growthTip")}
              </p>
              <p className="mt-0.5 text-[15px] leading-relaxed">{data.growthTip}</p>
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
          <Briefcase className="h-4 w-4 text-accent" />
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
