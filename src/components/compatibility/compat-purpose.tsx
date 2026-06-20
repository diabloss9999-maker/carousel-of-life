"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Lock, Sparkles, Target } from "lucide-react";

import {
  generateCompatPurposeAction,
  type CompatPurposeState,
} from "@/app/(dashboard)/compatibility/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompatPurposeOutput } from "@/lib/ai/types";
import { safeReadingText, safeShortText } from "@/lib/content/safety";
import { ROUTES } from "@/lib/constants";

interface CompatPurposeProps {
  subscribed: boolean;
  aName: string;
  aBirthDate: string;
  bName: string;
  bBirthDate: string;
  aMbti?: string;
  bMbti?: string;
}

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
        setErrorMsg(result.message ?? "분석을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  if (!subscribed) {
    return <LockedPremiumCard title="관계 목적별 궁합" />;
  }

  if (data) {
    const items = [
      { label: "연애", score: data.romance },
      { label: "결혼", score: data.marriage },
      { label: "일/사업", score: data.business },
      { label: "친구", score: data.friendship },
    ];

    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            관계 목적별 궁합
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            {items.map((item) => (
              <PurposeGauge key={item.label} label={item.label} score={item.score} />
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/25 bg-accent/5 p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-accent">
                잘 맞는 방향
              </p>
              <p className="mt-1 font-mystic text-[15px] font-semibold">
                {safeShortText(data.bestPurpose, "대화가 편한 관계")}
              </p>
            </div>
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-destructive">
                조심할 방향
              </p>
              <p className="mt-1 font-mystic text-[15px] font-semibold">
                {safeShortText(data.worstPurpose, "기대치가 커지는 관계")}
              </p>
            </div>
          </div>

          <p className="font-mystic leading-relaxed text-foreground/85">
            {safeReadingText(data.summary)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ActionCard
      title="관계 목적별 궁합"
      body="연애, 결혼, 친구, 일 관계 중 어느 방향이 가장 자연스러운지 분석해요."
      errorMsg={errorMsg}
      isPending={isPending}
      onGenerate={handleGenerate}
    />
  );
}

function LockedPremiumCard({ title }: { title: string }) {
  return (
    <Card className="app-surface ring-1 ring-accent/20">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-accent" />
          {title}
          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[12px] font-medium text-primary">
            라이트 이상
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 opacity-70">
          <p className="text-[15px]">목적별 점수와 관계 조언을 더 자세히 볼 수 있어요.</p>
          <p className="text-[15px]">플랜을 확인하면 추가 분석이 열려요.</p>
        </div>
        <Button asChild size="sm" className="w-full">
          <Link href={ROUTES.pricing}>
            <Sparkles className="h-3.5 w-3.5" />
            플랜 확인하기
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  body: string;
  errorMsg: string | null;
  isPending: boolean;
  onGenerate: () => void;
}

function ActionCard({
  title,
  body,
  errorMsg,
  isPending,
  onGenerate,
}: ActionCardProps) {
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[15px] text-muted-foreground">{body}</p>
        {errorMsg ? <p className="text-[15px] text-destructive">{errorMsg}</p> : null}
        <Button onClick={onGenerate} disabled={isPending} size="sm" className="w-full">
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              분석하는 중
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              추가 분석 보기
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
      <div className="flex items-center justify-between text-[15px]">
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
