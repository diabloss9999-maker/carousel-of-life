"use client";

/**
 * 유형 프리미엄 F — 직업 적성 심층 리포트 카드.
 *
 * 한 번 생성되면 영구 저장.
 */
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  CircleSlash,
  Loader2,
  Lock,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateCareerFitAction,
  type CareerFitState,
} from "@/app/(dashboard)/personality/actions";
import type { CareerFitOutput } from "@/lib/ai/types";

interface CareerFitProps {
  subscribed: boolean;
}

export function CareerFit({ subscribed }: CareerFitProps) {
  const [data, setData] = useState<CareerFitOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [didAutoLoad, setDidAutoLoad] = useState(false);

  useEffect(() => {
    if (!subscribed || didAutoLoad) return;
    setDidAutoLoad(true);
    startTransition(async () => {
      const result: CareerFitState = await generateCareerFitAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      }
    });
  }, [subscribed, didAutoLoad]);

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CareerFitState = await generateCareerFitAction();
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
            직업 적성 심층 리포트
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">빛나는 업무 환경</p>
            <p className="text-sm">잘 맞는 직군 5가지</p>
            <p className="text-sm">성장 팁</p>
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
            <Briefcase className="h-4 w-4 text-accent" />
            직업 적성 심층 리포트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5" /> 빛나는 업무 환경
            </p>
            <p className="font-mystic leading-relaxed">
              {data.bestEnvironment}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              잘 맞는 직군
            </p>
            <div className="flex flex-wrap gap-2">
              {data.fitRoles.map((role, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <CircleSlash className="h-4 w-4 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                피해야 할 환경
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">
                {data.avoidEnvironments}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              나의 업무 스타일
            </p>
            <p className="font-mystic leading-relaxed">{data.workStyle}</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <TrendingUp className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                직장에서 성장하는 팁
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">{data.growthTip}</p>
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
          <Briefcase className="h-4 w-4 text-accent" />
          직업 적성 심층 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          어떤 업무 환경·직군이 잘 맞는지 심층 분석. 한 번 생성하면 평생
          보관돼.
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
              직업 적성을 분석하는 중...
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
