/**
 * 운세 점수 추이 — 컴팩트 sparkline 카드.
 */
"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { FortuneTrend } from "@/lib/fortunes/trend";
import { cn } from "@/lib/utils";

interface FortuneTrendCardProps {
  trend: FortuneTrend;
}

const VIEW_W = 320;
const VIEW_H = 48;
const PAD_X = 2;
const PAD_Y = 4;

export function FortuneTrendCard({ trend }: FortuneTrendCardProps) {
  const t = useTranslations("fortuneTrend");
  if (trend.recorded === 0) return null;

  const points = trend.points;
  const n = points.length;
  const xStep = (VIEW_W - PAD_X * 2) / Math.max(1, n - 1);

  const yFor = (score: number) => {
    const ratio = score / 100;
    return VIEW_H - PAD_Y - ratio * (VIEW_H - PAD_Y * 2);
  };

  let path = "";
  let started = false;
  points.forEach((p, i) => {
    if (p.score === null) { started = false; return; }
    const x = PAD_X + i * xStep;
    const y = yFor(p.score);
    path += `${started ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
    started = true;
  });

  const areaSegments: string[] = [];
  let segStart: number | null = null;
  points.forEach((p, i) => {
    if (p.score !== null && segStart === null) segStart = i;
    const isEnd = p.score === null || i === n - 1;
    if (segStart !== null && isEnd) {
      const segEnd = p.score === null ? i - 1 : i;
      if (segEnd >= segStart) {
        let seg = "";
        for (let j = segStart; j <= segEnd; j++) {
          const sc = points[j].score;
          if (sc === null) continue;
          seg += `${j === segStart ? "M" : "L"}${(PAD_X + j * xStep).toFixed(1)},${yFor(sc).toFixed(1)} `;
        }
        seg += `L${(PAD_X + segEnd * xStep).toFixed(1)},${VIEW_H - PAD_Y} L${(PAD_X + segStart * xStep).toFixed(1)},${VIEW_H - PAD_Y} Z`;
        areaSegments.push(seg);
      }
      if (p.score === null) segStart = null;
    }
  });

  const todayScore = points[n - 1]?.score ?? null;
  const yesterdayScore = points[n - 2]?.score ?? null;
  const delta = todayScore !== null && yesterdayScore !== null ? todayScore - yesterdayScore : null;

  let DeltaIcon = Minus;
  let deltaColor = "text-muted-foreground";
  if (delta !== null) {
    if (delta > 0) { DeltaIcon = TrendingUp; deltaColor = "text-primary"; }
    else if (delta < 0) { DeltaIcon = TrendingDown; deltaColor = "text-destructive"; }
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur px-4 pt-3 pb-2 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="font-mystic text-sm font-medium text-foreground/80">
          {t("lastNDays", { n })}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {trend.average !== null && (
            <span className="tabular-nums">
              {t("avgScore", { n: trend.average })}
            </span>
          )}
          {delta !== null && (
            <span className={cn("flex items-center gap-0.5 tabular-nums font-medium", deltaColor)}>
              <DeltaIcon className="h-3 w-3" />
              {t("deltaScore", { delta: delta > 0 ? `+${delta}` : delta })}
            </span>
          )}
        </div>
      </div>

      {/* 그래프 */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.76 0.14 80)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="oklch(0.76 0.14 80)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 50점 기준선 */}
        <line
          x1={PAD_X} x2={VIEW_W - PAD_X}
          y1={yFor(50)} y2={yFor(50)}
          stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 3"
        />

        {areaSegments.map((d, i) => (
          <path key={i} d={d} fill="url(#fg2)" />
        ))}

        <path
          d={path} fill="none"
          stroke="oklch(0.76 0.14 80)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => {
          if (p.score === null) return null;
          const x = PAD_X + i * xStep;
          const y = yFor(p.score);
          const isLast = i === n - 1;
          return (
            <circle
              key={p.date}
              cx={x} cy={y}
              r={isLast ? 3 : 1.6}
              fill="oklch(0.76 0.14 80)"
              stroke="var(--card)"
              strokeWidth={isLast ? 1.5 : 0.8}
            />
          );
        })}
      </svg>

      {/* 날짜 */}
      <div className="flex justify-between px-0.5 -mt-1">
        {points.map((p, i) => {
          const [, mm, dd] = p.date.split("-");
          const isLast = i === n - 1;
          return (
            <span
              key={p.date}
              className={cn(
                "text-xs tabular-nums leading-none",
                isLast ? "text-foreground/80 font-medium" : "text-muted-foreground/65",
              )}
            >
              {`${Number(mm)}/${Number(dd)}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}
