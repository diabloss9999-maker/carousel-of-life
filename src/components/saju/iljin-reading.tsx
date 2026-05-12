"use client";

/**
 * 오늘의 일진 × 내 사주 카드.
 *
 * - 비라이트: 잠금 미리보기 + 결제 CTA
 * - 사주 미계산: 안내 메시지
 * - 라이트 + 사주 있음: 분석 버튼 → AI 해석 결과
 */

import { useState, useTransition } from "react";

import {
  AlertTriangle,
  Loader2,
  Lock,
  Minus,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  generateIljinAction,
  type IljinState,
} from "@/app/(dashboard)/saju/actions";

interface IljinReadingProps {
  subscribed: boolean;
  hasSaju: boolean;
}

const ENERGY_STYLE = {
  긍정적: {
    icon: Sun,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  중립: {
    icon: Minus,
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/20",
  },
  "주의 필요": {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
  },
} as const;

const RELATION_COLOR = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-slate-400",
} as const;

const RELATION_LABEL = {
  positive: "합",
  negative: "충",
  neutral: "—",
} as const;

export function IljinReading({ subscribed, hasSaju }: IljinReadingProps) {
  const [result, setResult] = useState<IljinState | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const r = await generateIljinAction();
      setResult(r);
    });
  }

  // 비라이트
  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" />
            오늘의 일진 × 내 사주
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              라이트
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="pointer-events-none select-none space-y-1.5 text-sm text-muted-foreground blur-[3px]">
            <p>오늘 壬寅일이 내 일주와 삼합을 이뤄요</p>
            <p>결단하기 좋은 날 — 오전에 중요한 일 처리 권장</p>
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

  // 사주 미계산
  if (!hasSaju) {
    return (
      <Card className="app-surface">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          사주를 먼저 계산해야 일진 분석이 가능해.
        </CardContent>
      </Card>
    );
  }

  // 결과
  if (result?.kind === "success" && result.data) {
    const { data, relationships } = result;
    const energyKey = data.overallEnergy as keyof typeof ENERGY_STYLE;
    const energyStyle = ENERGY_STYLE[energyKey] ?? ENERGY_STYLE["중립"];
    const EnergyIcon = energyStyle.icon;

    return (
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            오늘의 일진 × 내 사주
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 일진 헤더 */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3",
              energyStyle.bg,
            )}
          >
            <EnergyIcon
              className={cn("h-5 w-5 flex-shrink-0", energyStyle.color)}
            />
            <div>
              <p
                className={cn(
                  "font-mystic text-lg leading-none font-bold",
                  energyStyle.color,
                )}
              >
                {data.todayPillar}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.overallEnergy}
              </p>
            </div>
          </div>

          {/* 충·합 관계 */}
          {relationships && relationships.length > 0 && (
            <div className="space-y-1.5">
              {relationships.map((r, i) => {
                const colorKey = r.energy as keyof typeof RELATION_COLOR;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className={cn(
                        "mt-0.5 flex-shrink-0 font-bold",
                        RELATION_COLOR[colorKey] ?? RELATION_COLOR.neutral,
                      )}
                    >
                      {RELATION_LABEL[colorKey] ?? RELATION_LABEL.neutral}
                    </span>
                    <span className="text-muted-foreground">
                      {r.description}: {r.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 핵심 메시지 */}
          <p className="font-mystic text-sm leading-relaxed">
            {data.mainMessage}
          </p>

          {/* 조언 */}
          <div className="space-y-1.5 rounded-xl bg-white/8 px-3 py-2.5">
            <p className="text-xs font-semibold text-accent">오늘의 조언</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {data.advice}
            </p>
          </div>

          {/* 좋은 시간 + 주의 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-2">
              <p className="mb-0.5 font-semibold text-emerald-400">좋은 시간</p>
              <p className="text-muted-foreground">{data.luckyTime}</p>
            </div>
            <div className="rounded-lg border border-red-400/20 bg-red-400/8 px-2.5 py-2">
              <p className="mb-0.5 font-semibold text-red-400">주의</p>
              <p className="text-muted-foreground">{data.caution}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러
  if (result?.kind === "error") {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            오늘의 일진 × 내 사주
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-destructive">{result.message}</p>
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 초기 상태
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" />
          오늘의 일진 × 내 사주
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          오늘 날짜의 일주(日柱)가 내 사주와 어떤 충·합을 이루는지 분석해줄게.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              분석 중…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              오늘 일진 보기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
