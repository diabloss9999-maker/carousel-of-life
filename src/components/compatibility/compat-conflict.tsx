"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  HeartHandshake,
  Loader2,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCompatConflictAction,
  type CompatConflictState,
} from "@/app/(dashboard)/compatibility/actions";
import type { CompatConflictOutput } from "@/lib/ai/types";

interface CompatConflictProps {
  subscribed: boolean;
  aName: string;
  aBirthDate: string;
  aGender: string;
  bName: string;
  bBirthDate: string;
  bGender: string;
  aMbti?: string;
  bMbti?: string;
}

export function CompatConflict(props: CompatConflictProps) {
  const { subscribed } = props;
  const [data, setData] = useState<CompatConflictOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("compatConflict");
  const tPrem = useTranslations("premiumCard");

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CompatConflictState = await generateCompatConflictAction(
        props.aName,
        props.aBirthDate,
        props.aGender,
        props.bName,
        props.bBirthDate,
        props.bGender,
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
            <HeartHandshake className="h-4 w-4 text-accent" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> {t("triggers")}
            </p>
            <ul className="space-y-2">
              {data.triggers.map((trigger, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{trigger}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("pattern")}
            </p>
            <p className="font-mystic leading-relaxed text-foreground/90">
              {data.pattern}
            </p>
          </div>

          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              {t("resolution")}
            </p>
            <p className="font-mystic leading-relaxed">{data.resolution}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <Shield className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {t("avoidTip")}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">{data.avoidTip}</p>
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
          <HeartHandshake className="h-4 w-4 text-accent" />
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
