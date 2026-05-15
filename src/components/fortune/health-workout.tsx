"use client";

import { useState, useTransition } from "react";
import { Lock, Sparkles, Loader2, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateHealthWorkoutAction } from "@/app/(dashboard)/today/actions";
import type { HealthWorkoutOutput } from "@/lib/ai/types";

interface HealthWorkoutProps {
  subscribed: boolean;
}

/**
 * 운동 리스트 카드 — 라벨 + 항목 목록.
 */
function WorkoutList({
  list,
  label,
}: {
  list: HealthWorkoutOutput["bodyworkouts"];
  label: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      {list.map((w, i) => (
        <div
          key={i}
          className="space-y-2 rounded-xl border border-border/40 bg-card/40 p-4"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[15px] font-bold text-primary flex-shrink-0">
              {i + 1}
            </span>
            <p className="font-mystic font-semibold text-[15px]">{w.name}</p>
            <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[15px] text-accent font-medium">
              {w.reps}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{w.howTo}</p>
          <p className="text-[15px] text-primary/80 font-medium">✓ {w.benefit}</p>
        </div>
      ))}
    </div>
  );
}

export function HealthWorkout({ subscribed }: HealthWorkoutProps) {
  const [bodyworkouts, setBodyWorkouts] = useState<HealthWorkoutOutput["bodyworkouts"] | null>(null);
  const [gymWorkouts, setGymWorkouts] = useState<HealthWorkoutOutput["gymWorkouts"] | null>(null);
  const [quote, setQuote] = useState<HealthWorkoutOutput["quote"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("healthReport");
  const tPrem = useTranslations("premiumCard");

  const lockBullets = [
    t("lockBullet1"),
    t("lockBullet2"),
    t("lockBullet3"),
    t("lockBullet4"),
  ];

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateHealthWorkoutAction();
      if (result.kind === "success" && result.bodyworkouts) {
        setBodyWorkouts(result.bodyworkouts);
        if (result.gymWorkouts) setGymWorkouts(result.gymWorkouts);
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
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[15px] font-medium text-primary">
              {tPrem("lightBadge")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 select-none blur-[3px] pointer-events-none">
            {lockBullets.map((line) => (
              <div key={line} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-accent/30 flex-shrink-0" />
                <p className="text-[15px]">{line}</p>
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

  if (!bodyworkouts) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Dumbbell className="h-4 w-4 text-accent" aria-hidden />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[15px] text-muted-foreground">
            {t("lockBody")}
          </p>
          {error && <p className="text-[15px] text-destructive">{error}</p>}
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
                <Dumbbell className="h-3.5 w-3.5" aria-hidden />
                {t("workoutCta")}
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
          <Dumbbell className="h-4 w-4 text-accent" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {bodyworkouts && <WorkoutList list={bodyworkouts} label={t("bodyweight")} />}
        {gymWorkouts && <WorkoutList list={gymWorkouts} label={t("equipment")} />}

        {quote && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="font-mystic text-[15px] leading-relaxed text-foreground/85 italic">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-1.5 text-right text-[15px] text-muted-foreground">
              — {quote.author}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
