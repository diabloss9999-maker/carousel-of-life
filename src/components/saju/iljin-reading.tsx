"use client";

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
  positive: {
    icon: Sun,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    label: "상승 흐름",
  },
  neutral: {
    icon: Minus,
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/20",
    label: "차분한 흐름",
  },
  caution: {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    label: "주의 필요",
  },
} as const;

type EnergyKey = keyof typeof ENERGY_STYLE;

function normalizeEnergy(raw: string): EnergyKey {
  if (raw === "positive" || raw === "neutral" || raw === "caution") return raw;
  if (raw.includes("긍정") || raw.includes("상승")) return "positive";
  if (raw.includes("주의") || raw.includes("조심")) return "caution";
  return "neutral";
}

const RELATION_COLOR = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-slate-400",
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

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" />
            오늘 일진
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[15px] font-medium text-primary">
              라이트
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="pointer-events-none select-none space-y-1.5 text-[15px] text-muted-foreground blur-[3px]">
            <p>오늘의 기운과 내 사주가 만나는 지점을 봐요.</p>
            <p>좋은 시간, 조심할 점, 바로 적용할 조언을 정리해요.</p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" />
              구독 확인하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasSaju) {
    return (
      <Card className="app-surface">
        <CardContent className="py-6 text-center text-[15px] text-muted-foreground">
          사주를 먼저 계산하면 오늘 일진을 볼 수 있어요.
        </CardContent>
      </Card>
    );
  }

  if (result?.kind === "success" && result.data) {
    const { data, relationships } = result;
    const energyKey = normalizeEnergy(data.overallEnergy);
    const energyStyle = ENERGY_STYLE[energyKey];
    const EnergyIcon = energyStyle.icon;

    return (
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            오늘 일진
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3",
              energyStyle.bg,
            )}
          >
            <EnergyIcon
              className={cn("h-5 w-5 shrink-0", energyStyle.color)}
            />
            <div>
              <p
                className={cn(
                  "font-mystic text-lg font-bold leading-none",
                  energyStyle.color,
                )}
              >
                {data.todayPillar}
              </p>
              <p className="mt-0.5 text-[15px] text-muted-foreground">
                {energyStyle.label}
              </p>
            </div>
          </div>

          {relationships && relationships.length > 0 ? (
            <div className="space-y-1.5">
              {relationships.map((r, i) => {
                const colorKey =
                  (r.energy as keyof typeof RELATION_COLOR) in RELATION_COLOR
                    ? (r.energy as keyof typeof RELATION_COLOR)
                    : "neutral";
                return (
                  <div key={i} className="flex items-start gap-2 text-[15px]">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 font-bold",
                        RELATION_COLOR[colorKey],
                      )}
                    >
                      {colorKey === "positive"
                        ? "좋음"
                        : colorKey === "negative"
                          ? "주의"
                          : "보통"}
                    </span>
                    <span className="text-muted-foreground">
                      {r.description}: {r.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <p className="font-mystic text-[15px] leading-relaxed">
            {data.mainMessage}
          </p>

          <div className="space-y-1.5 rounded-xl bg-white/8 px-3 py-2.5">
            <p className="text-[15px] font-semibold text-accent">조언</p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {data.advice}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[15px]">
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-2">
              <p className="mb-0.5 font-semibold text-emerald-400">좋은 시간</p>
              <p className="text-muted-foreground">{data.luckyTime}</p>
            </div>
            <div className="rounded-lg border border-red-400/20 bg-red-400/8 px-2.5 py-2">
              <p className="mb-0.5 font-semibold text-red-400">주의할 점</p>
              <p className="text-muted-foreground">{data.caution}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result?.kind === "error") {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            오늘 일진
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[15px] text-destructive">{result.message}</p>
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

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" />
          오늘 일진
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[15px] text-muted-foreground">
          오늘의 기운이 내 사주와 어떻게 만나는지 확인해요.
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
              분석 중
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
