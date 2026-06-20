"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  Loader2,
  Lock,
  MessageCircle,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  generateCompatTodayAction,
  type CompatTodayState,
} from "@/app/(dashboard)/compatibility/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompatTodayOutput } from "@/lib/ai/types";
import { safeReadingText } from "@/lib/content/safety";
import { ROUTES } from "@/lib/constants";

interface CompatTodayProps {
  subscribed: boolean;
  aName: string;
  bName: string;
  compatScore: number;
  aMbti?: string;
  bMbti?: string;
}

export function CompatToday(props: CompatTodayProps) {
  const { subscribed } = props;
  const [data, setData] = useState<CompatTodayOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CompatTodayState = await generateCompatTodayAction(
        props.aName,
        props.bName,
        props.compatScore,
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
    return <LockedPremiumCard title="오늘의 관계 흐름" />;
  }

  if (data) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-accent" />
            오늘의 관계 흐름
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={
              data.isGoodDay
                ? "flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 p-3"
                : "flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
            }
          >
            {data.isGoodDay ? (
              <Check className="h-5 w-5 text-accent" />
            ) : (
              <X className="h-5 w-5 text-destructive" />
            )}
            <p className="font-mystic text-[15px] font-semibold">
              {data.isGoodDay ? "다가가기 좋은 날이에요" : "천천히 조율하면 좋아요"}
            </p>
          </div>

          <InfoBlock label="접근법" body={data.approach} />

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">
                메시지 힌트
              </p>
              <p className="mt-0.5 text-[15px] leading-relaxed">
                {safeReadingText(data.messageIdea)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-destructive">
                주의할 점
              </p>
              <p className="mt-0.5 text-[15px] leading-relaxed">
                {safeReadingText(data.caution)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ActionCard
      title="오늘의 관계 흐름"
      body="오늘 먼저 연락해도 좋은지, 어떤 말투가 편한지 확인해요."
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
        <p className="text-[15px] text-muted-foreground">
          플랜을 확인하면 오늘의 연락 타이밍과 메시지 힌트를 볼 수 있어요.
        </p>
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
          <Calendar className="h-4 w-4 text-accent" />
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

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="space-y-1.5 rounded-xl app-surface p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-mystic leading-relaxed text-foreground/90">
        {safeReadingText(body)}
      </p>
    </div>
  );
}
