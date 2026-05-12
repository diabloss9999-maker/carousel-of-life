"use client";

/**
 * 궁합 라이트 C — 오늘 이 사람에게 어떻게?
 *
 * 오늘의 일진 × 두 사람 궁합 기반 즉시 조언 (매일 달라짐).
 */
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCompatTodayAction,
  type CompatTodayState,
} from "@/app/(dashboard)/compatibility/actions";
import type { CompatTodayOutput } from "@/lib/ai/types";

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
            오늘 이 사람에게 어떻게?
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              라이트
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">오늘 가까이 지내기 좋은 날</p>
            <p className="text-sm">오늘 보내기 좋은 메시지 톤</p>
            <p className="text-sm">오늘 하지 말아야 할 것</p>
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
            <Calendar className="h-4 w-4 text-accent" />
            오늘 {props.bName}에게 어떻게?
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
            <p className="font-mystic text-sm font-semibold">
              {data.isGoodDay
                ? "오늘은 가까이 지내기 좋은 날이야."
                : "오늘은 거리감을 두는 게 좋겠어."}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              오늘의 접근법
            </p>
            <p className="font-mystic leading-relaxed">{data.approach}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                메시지 아이디어
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">
                {data.messageIdea}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <TriangleAlert className="h-4 w-4 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                오늘 피해야 할 것
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">{data.caution}</p>
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
          <Calendar className="h-4 w-4 text-accent" />
          오늘 {props.bName}에게 어떻게?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          오늘의 일진과 두 사람 궁합을 합쳐 오늘 어떻게 다가가야 하는지 즉석
          조언을 받아 봐.
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
              오늘의 기운을 살피는 중...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              오늘의 조언 받기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
