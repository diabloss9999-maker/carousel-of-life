"use client";

/**
 * 궁합 라이트 A — 관계 목적별 점수 카드.
 *
 * 두 사람이 연애·결혼·비즈니스·친구 각 관계로 얼마나 맞는지 0~100점 게이지로 보여준다.
 *
 * - 비라이트: 잠금 미리보기 + pricing 링크.
 * - 라이트: "분석 받기" 버튼 → 결과 표시.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Lock, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCompatPurposeAction,
  type CompatPurposeState,
} from "@/app/(dashboard)/compatibility/actions";
import type { CompatPurposeOutput } from "@/lib/ai/types";

interface CompatPurposeProps {
  subscribed: boolean;
  aName: string;
  aBirthDate: string;
  bName: string;
  bBirthDate: string;
  aMbti?: string;
  bMbti?: string;
}

const PURPOSE_LABELS = {
  romance: "연애",
  marriage: "결혼",
  business: "비즈니스",
  friendship: "친구",
} as const;

export function CompatPurpose(props: CompatPurposeProps) {
  const { subscribed } = props;
  const [data, setData] = useState<CompatPurposeOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CompatPurposeState = await generateCompatPurposeAction(
        props.aName,
        props.aBirthDate,
        props.bName,
        props.bBirthDate,
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
            관계 목적별 궁합 점수
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              라이트
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">연애 86점</p>
            <p className="text-sm">결혼 72점</p>
            <p className="text-sm">비즈니스 64점</p>
            <p className="text-sm">친구 90점</p>
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
    const items: Array<{ key: keyof typeof PURPOSE_LABELS; score: number }> = [
      { key: "romance", score: data.romance },
      { key: "marriage", score: data.marriage },
      { key: "business", score: data.business },
      { key: "friendship", score: data.friendship },
    ];

    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            관계 목적별 궁합 점수
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            {items.map((item) => (
              <PurposeGauge
                key={item.key}
                label={PURPOSE_LABELS[item.key]}
                score={item.score}
              />
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/25 bg-accent/5 p-3">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                가장 잘 맞는 관계
              </p>
              <p className="mt-1 font-mystic text-sm font-semibold">
                {data.bestPurpose}
              </p>
            </div>
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                가장 안 맞는 관계
              </p>
              <p className="mt-1 font-mystic text-sm font-semibold">
                {data.worstPurpose}
              </p>
            </div>
          </div>

          <p className="font-mystic leading-relaxed text-foreground/85">
            {data.summary}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-accent" />
          관계 목적별 궁합 점수
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          연애·결혼·비즈니스·친구 각 관계 목적으로 두 사람이 얼마나 맞는지
          점수로 분석해 봐.
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

function PurposeGauge({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const gaugeStyle = { "--gauge": `${clamped}%` } as React.CSSProperties;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mystic font-medium">{label}</span>
        <span className="font-mystic font-semibold">{clamped} / 100</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-card"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        style={gaugeStyle}
      >
        <div className="h-full w-[var(--gauge)] rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-700 ease-out" />
      </div>
    </div>
  );
}
