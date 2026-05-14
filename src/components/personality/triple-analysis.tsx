"use client";

import { CharacterImage } from "@/components/shared/character-image";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Layers, Loader2, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateTripleAnalysisAction,
  type TripleAnalysisState,
} from "@/app/(dashboard)/personality/actions";
import type { TripleAnalysisOutput } from "@/lib/ai/types";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

interface TripleAnalysisProps {
  subscribed: boolean;
}

export function TripleAnalysis({ subscribed }: TripleAnalysisProps) {
  const [data, setData] = useState<TripleAnalysisOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const didAutoLoadRef = useRef(false);
  const t = useTranslations("tripleAnalysis");
  const tPrem = useTranslations("premiumCard");
  const tChar = useTranslations("characters");

  useEffect(() => {
    if (!subscribed || didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;
    startTransition(async () => {
      const result: TripleAnalysisState = await generateTripleAnalysisAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      }
    });
  }, [subscribed]);

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: TripleAnalysisState = await generateTripleAnalysisAction();
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
    const charId = getTodayCharacter();
    const character = CHARACTERS[charId];
    const charName = tChar(`${charId}.name`);
    return (
      <Card className="app-surface">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-mystic flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-accent" />
              {t("title")}
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative h-9 w-6 overflow-hidden rounded-lg shadow-sm">
                <CharacterImage character={character} fill className="object-cover object-top" sizes="24px" />
              </div>
              <p className="font-mystic text-[10px] font-semibold text-foreground/70">{charName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              {t("convergence")}
            </p>
            <p className="font-mystic leading-relaxed">{data.convergence}</p>
          </div>

          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              {t("contradiction")}
            </p>
            <p className="font-mystic leading-relaxed">{data.contradiction}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("trueNature")}
              </p>
              <p className="font-mystic leading-relaxed">{data.trueNature}</p>
            </div>
            <div className="border-t border-border/40 pt-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("uniqueStrength")}
              </p>
              <p className="font-mystic leading-relaxed">
                {data.uniqueStrength}
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
          <Layers className="h-4 w-4 text-accent" />
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
