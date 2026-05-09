"use client";

/**
 * 오늘의 사랑 리포트 — 프리미엄 전용 카드.
 *
 * - 비프리미엄: 잠금 미리보기 + 결제 CTA.
 * - 프리미엄 + 미생성: "리포트 받기" 버튼.
 * - 프리미엄 + 생성됨: 오늘 전할 한마디 + 매력 팁 3가지.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES } from "@/lib/constants";
import {
  generateLovePremiumAction,
  type LovePremiumState,
} from "@/app/(dashboard)/today/actions";
import type { LovePremiumOutput } from "@/lib/ai/types";

interface LoveCardProps {
  /** 오늘의 사랑 운세 — 헤드라인 외 카드 본문에는 직접 노출하지 않는다(현재 사용 안 함). */
  fortune: DailyFortune;
  subscribed: boolean;
}

export function LoveCard({ subscribed }: LoveCardProps) {
  const [data, setData] = useState<LovePremiumOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: LovePremiumState = await generateLovePremiumAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      } else {
        setErrorMsg(result.message ?? "불러오지 못했어.");
      }
    });
  };

  // 1) 비프리미엄: 잠금 미리보기
  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" />
            오늘의 사랑 리포트
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">💌 오늘 전할 한마디</p>
            <p className="text-sm">✨ 나를 더 매력적으로 만드는 팁 3가지</p>
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

  // 2) 프리미엄 + 생성됨: 결과
  if (data) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-accent" />
            오늘의 사랑 리포트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 오늘의 한마디 */}
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              💌 오늘 전할 한마디
            </p>
            <p className="font-mystic text-base leading-relaxed">
              {data.message.text}
            </p>
            <p className="text-xs text-muted-foreground">
              📍 {data.message.situation}
            </p>
          </div>

          {/* 매력 팁 3가지 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              ✨ 오늘의 매력 팁
            </p>
            <ol className="space-y-3">
              {data.charmTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-mystic text-sm font-semibold">
                      {tip.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3) 프리미엄 + 미생성: 버튼
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-accent" />
          오늘의 사랑 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          오늘 전할 달콤한 한마디와 나를 더 매력적으로 만드는 팁을 받아봐.
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
              불러오는 중...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              리포트 받기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
