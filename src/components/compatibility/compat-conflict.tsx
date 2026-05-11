"use client";

/**
 * 궁합 프리미엄 B — 갈등 패턴 + 화해법 카드.
 *
 * 두 사람이 어디서 부딪히는지 + 어떻게 풀어야 하는지를 알려준다.
 */
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
        setErrorMsg(result.message ?? "분석에 실패했어.");
      }
    });
  };

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" />
            갈등 패턴 + 화해법
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">갈등 유발 상황 3가지</p>
            <p className="text-sm">반복되는 갈등 패턴</p>
            <p className="text-sm">화해·해결법</p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" />
              프리미엄으로 확인하기
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
            갈등 패턴 + 화해법
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> 갈등 유발 상황
            </p>
            <ul className="space-y-2">
              {data.triggers.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              반복되는 갈등 패턴
            </p>
            <p className="font-mystic leading-relaxed text-foreground/90">
              {data.pattern}
            </p>
          </div>

          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              화해·해결법
            </p>
            <p className="font-mystic leading-relaxed">{data.resolution}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <Shield className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                갈등 예방 팁
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
          갈등 패턴 + 화해법
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          두 사람이 어디서 부딪히는지 + 갈등을 부드럽게 푸는 법을 분석해 봐.
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
              분석하는 중...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              분석 받기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
