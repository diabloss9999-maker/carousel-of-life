"use client";

/**
 * 유형 라이트 E — 스트레스 유형 + 회복법 카드.
 *
 * 한 번 생성되면 영구 저장.
 */
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
  // 마운트 1회 자동 로드 가드 — ref 로 처리해 effect 내 setState 회피
  const didAutoLoadRef = useRef(false);

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
            스트레스 유형 + 회복법
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              라이트
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">스트레스 유발 상황 3가지</p>
            <p className="text-sm">무너질 때의 패턴</p>
            <p className="text-sm">빠른 회복법 3가지</p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" />
              라이트로 확인하기
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
            스트레스 유형 + 회복법
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> 스트레스 유발 상황
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
              무너질 때 나타나는 패턴
            </p>
            <p className="font-mystic leading-relaxed">
              {data.collapsePattern}
            </p>
          </div>

          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              빠른 회복법
            </p>
            <ol className="space-y-2">
              {data.recoveryTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
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
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                위험 신호
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">
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
          스트레스 유형 + 회복법
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          내 유형이 스트레스 받을 때 어떻게 무너지는지, 빠르게 회복하는 법까지
          한 번 생성하면 평생 보관돼.
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
              스트레스 패턴을 살피는 중...
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
