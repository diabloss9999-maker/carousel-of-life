"use client";

import { useState, useTransition } from "react";
import { Lock, Sparkles, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateStudyTipsAction } from "@/app/(dashboard)/today/actions";
import type { StudyTipsOutput } from "@/lib/ai/types";

interface StudyTipsProps {
  subscribed: boolean;
}

export function StudyTips({ subscribed }: StudyTipsProps) {
  const [tips, setTips] = useState<StudyTipsOutput["tips"] | null>(null);
  const [quote, setQuote] = useState<StudyTipsOutput["quote"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("studyReport");
  const tPrem = useTranslations("premiumCard");

  const lockBullets = [t("lockBullet1"), t("lockBullet2"), t("lockBullet3")];

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateStudyTipsAction();
      if (result.kind === "success" && result.tips) {
        setTips(result.tips);
        if (result.quote) setQuote(result.quote);
      } else {
        setError(result.message ?? tPrem("genericError"));
      }
    });
  }

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" aria-hidden />
            {t("title")}
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              {tPrem("lightBadge")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 select-none blur-[3px] pointer-events-none">
            {lockBullets.map((line) => (
              <div key={line} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-accent/30 flex-shrink-0" />
                <p className="text-sm">{line}</p>
              </div>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {tPrem("verifyCta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tips) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-accent" aria-hidden />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("lockBody")}
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {tPrem("analyzing")}
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {t("getTipsCta")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-accent" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-mystic text-sm font-semibold">{tip.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {tip.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {quote && (
          <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
            <p className="font-mystic text-sm leading-relaxed text-foreground/85 italic">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-1.5 text-right text-xs text-muted-foreground">
              — {quote.author}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
