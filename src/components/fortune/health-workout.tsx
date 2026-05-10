"use client";

import { useState, useTransition } from "react";
import { Lock, Sparkles, Loader2, Dumbbell } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateHealthWorkoutAction } from "@/app/(dashboard)/today/actions";
import type { HealthWorkoutOutput } from "@/lib/ai/types";

interface HealthWorkoutProps {
  subscribed: boolean;
}

/**
 * 건강 운세 프리미엄 — 오늘의 맞춤 맨몸 운동 3가지 카드.
 *
 * - 비프리미엄: 흐릿한 미리보기 + 프리미엄 CTA.
 * - 프리미엄 + 미생성: "운동 추천 받기" 버튼.
 * - 프리미엄 + 생성됨: 운동 3가지 상세 표시.
 */
export function HealthWorkout({ subscribed }: HealthWorkoutProps) {
  const [bodyworkouts, setBodyWorkouts] = useState<HealthWorkoutOutput["bodyworkouts"] | null>(null);
  const [gymWorkouts, setGymWorkouts] = useState<HealthWorkoutOutput["gymWorkouts"] | null>(null);
  const [quote, setQuote] = useState<HealthWorkoutOutput["quote"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateHealthWorkoutAction();
      if (result.kind === "success" && result.bodyworkouts) {
        setBodyWorkouts(result.bodyworkouts);
        if (result.gymWorkouts) setGymWorkouts(result.gymWorkouts);
        if (result.quote) setQuote(result.quote);
      } else {
        setError(result.message ?? "오류가 발생했어.");
      }
    });
  }

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" aria-hidden />
            오늘의 맞춤 운동
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 select-none blur-[3px] pointer-events-none">
            {[
              "🏠 맨몸 운동 3가지 추천",
              "🏋️ 기구 운동 3가지 추천",
              "각 운동 방법 상세 설명",
              "어디에 좋은지 효과 + 권장 횟수",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-accent/30 flex-shrink-0" />
                <p className="text-sm">{t}</p>
              </div>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              프리미엄으로 확인하기
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
            오늘의 맞춤 운동
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            기구 없이 집에서 바로 할 수 있는 맞춤 운동 3가지를 알려줄게.
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
                분석 중…
              </>
            ) : (
              <>
                <Dumbbell className="h-3.5 w-3.5" aria-hidden />
                운동 추천 받기
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const WorkoutList = ({ list, label }: { list: HealthWorkoutOutput["bodyworkouts"]; label: string }) => (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {list.map((w, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border/40 bg-card/40 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary flex-shrink-0">{i + 1}</span>
            <p className="font-mystic font-semibold text-sm">{w.name}</p>
            <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent font-medium">{w.reps}</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{w.howTo}</p>
          <p className="text-xs text-primary/80 font-medium">✓ {w.benefit}</p>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Dumbbell className="h-4 w-4 text-accent" aria-hidden />
          오늘의 맞춤 운동
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {bodyworkouts && <WorkoutList list={bodyworkouts} label="🏠 맨몸 운동" />}
        {gymWorkouts && <WorkoutList list={gymWorkouts} label="🏋️ 기구 운동" />}

        {quote && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
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
