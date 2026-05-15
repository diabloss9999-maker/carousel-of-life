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
import { useTranslations } from "next-intl";

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
  },
  neutral: {
    icon: Minus,
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/20",
  },
  caution: {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
  },
} as const;

type EnergyKey = keyof typeof ENERGY_STYLE;

/**
 * AI 응답·구버전 캐시의 overallEnergy 값을 영문 enum 으로 정규화한다.
 * - 신버전: "positive" | "neutral" | "caution"
 * - 구버전 캐시: "긍정적" | "중립" | "주의 필요"
 * - 알 수 없는 값은 "neutral" 로 폴백.
 */
function normalizeEnergy(raw: string): EnergyKey {
  if (raw === "positive" || raw === "neutral" || raw === "caution") return raw;
  if (raw === "긍정적") return "positive";
  if (raw === "중립") return "neutral";
  if (raw === "주의 필요" || raw === "주의필요") return "caution";
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
  const t = useTranslations("iljin");
  const tPrem = useTranslations("premiumCard");

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
            {t("title")}
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {tPrem("lightBadge")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="pointer-events-none select-none space-y-1.5 text-sm text-muted-foreground blur-[3px]">
            <p>{t("lockBullet1")}</p>
            <p>{t("lockBullet2")}</p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" />
              {tPrem("verifyCta")}
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
          {t("emptyMessage")}
        </CardContent>
      </Card>
    );
  }

  // 결과
  if (result?.kind === "success" && result.data) {
    const { data, relationships } = result;
    const energyKey = normalizeEnergy(data.overallEnergy);
    const energyStyle = ENERGY_STYLE[energyKey];
    const EnergyIcon = energyStyle.icon;
    const ENERGY_LABEL_KEY = {
      positive: "energyPositive",
      neutral: "energyNeutral",
      caution: "energyCaution",
    } as const;
    const RELATION_LABEL_KEY = {
      positive: "relPositive",
      negative: "relNegative",
      neutral: null,
    } as const;

    return (
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" />
            {t("title")}
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
                {t(ENERGY_LABEL_KEY[energyKey])}
              </p>
            </div>
          </div>

          {/* 충·합 관계 */}
          {relationships && relationships.length > 0 && (
            <div className="space-y-1.5">
              {relationships.map((r, i) => {
                const colorKey = (r.energy as keyof typeof RELATION_COLOR) in RELATION_COLOR
                  ? (r.energy as keyof typeof RELATION_COLOR)
                  : "neutral";
                const labelKey = RELATION_LABEL_KEY[colorKey];
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className={cn(
                        "mt-0.5 flex-shrink-0 font-bold",
                        RELATION_COLOR[colorKey],
                      )}
                    >
                      {labelKey ? t(labelKey) : "—"}
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
            <p className="text-xs font-semibold text-accent">{t("advice")}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {data.advice}
            </p>
          </div>

          {/* 좋은 시간 + 주의 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-2">
              <p className="mb-0.5 font-semibold text-emerald-400">{t("luckyHour")}</p>
              <p className="text-muted-foreground">{data.luckyTime}</p>
            </div>
            <div className="rounded-lg border border-red-400/20 bg-red-400/8 px-2.5 py-2">
              <p className="mb-0.5 font-semibold text-red-400">{t("caution")}</p>
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
            {t("title")}
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
            {t("retry")}
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
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("body")}
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
              {t("analyzing")}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {t("showCta")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
