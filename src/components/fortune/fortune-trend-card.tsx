/**
 * 운세 점수 추이 카드 — 최근 N일 종합운 점수 sparkline.
 *
 * 빈 날(아직 풀이를 안 본 날)은 점선/투명 점으로 표시한다.
 * SVG 만 사용 — 추가 차트 라이브러리 불필요.
 */
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FortuneTrend } from "@/lib/fortunes/trend";
import { cn } from "@/lib/utils";

interface FortuneTrendCardProps {
  trend: FortuneTrend;
}

const VIEW_W = 320;
const VIEW_H = 80;
const PAD_X = 4;
const PAD_Y = 8;

export function FortuneTrendCard({ trend }: FortuneTrendCardProps) {
  if (trend.recorded === 0) {
    return null; // 아직 데이터가 한 건도 없으면 위젯을 숨긴다.
  }

  const points = trend.points;
  const n = points.length;
  const xStep = (VIEW_W - PAD_X * 2) / Math.max(1, n - 1);

  const yFor = (score: number) => {
    // 점수 1-100 → y 좌표 (위가 높음).
    const ratio = (score - 0) / 100;
    return VIEW_H - PAD_Y - ratio * (VIEW_H - PAD_Y * 2);
  };

  // 폴리라인 path (null 구간은 끊는다 — Move 명령으로).
  let path = "";
  let started = false;
  points.forEach((p, i) => {
    if (p.score === null) {
      started = false;
      return;
    }
    const x = PAD_X + i * xStep;
    const y = yFor(p.score);
    path += `${started ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)} `;
    started = true;
  });

  // 영역 채우기용 — 가장 마지막 유효 인덱스까지의 area.
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
          const x = PAD_X + j * xStep;
          const y = yFor(sc);
          seg += `${j === segStart ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
        }
        const xStartSeg = PAD_X + segStart * xStep;
        const xEndSeg = PAD_X + segEnd * xStep;
        seg = `${seg}L${xEndSeg.toFixed(2)},${VIEW_H - PAD_Y} L${xStartSeg.toFixed(2)},${VIEW_H - PAD_Y} Z`;
        areaSegments.push(seg);
      }
      segStart = p.score === null ? null : segStart;
      if (p.score === null) segStart = null;
    }
  });

  const todayPoint = points[points.length - 1];
  const yesterdayPoint = points[points.length - 2];

  // 어제 대비 변화 (둘 다 점수가 있을 때).
  let delta: number | null = null;
  if (
    todayPoint?.score !== null &&
    todayPoint?.score !== undefined &&
    yesterdayPoint?.score !== null &&
    yesterdayPoint?.score !== undefined
  ) {
    delta = todayPoint.score - yesterdayPoint.score;
  }

  const trendLabel =
    delta === null
      ? "—"
      : delta > 0
        ? `+${delta}점`
        : delta < 0
          ? `${delta}점`
          : "변동 없음";

  return (
    <Card className="app-surface">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <Activity className="h-4 w-4 text-primary" aria-hidden />
              최근 {n}일 흐름
            </CardTitle>
            <CardDescription className="text-xs">
              종합운 점수의 흐름이야 — 너의 기운이 어떻게 흘러왔는지.
            </CardDescription>
          </div>
          <DeltaBadge delta={delta} label={trendLabel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          role="img"
          aria-label={`최근 ${n}일 운세 점수 추이 그래프`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="fortuneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="oklch(0.76 0.14 80)"
                stopOpacity="0.55"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.76 0.14 80)"
                stopOpacity="0.05"
              />
            </linearGradient>
          </defs>

          {/* 50점 기준선 */}
          <line
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={yFor(50)}
            y2={yFor(50)}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeDasharray="3 3"
          />

          {/* 영역 */}
          {areaSegments.map((d, i) => (
            <path key={`a-${i}`} d={d} fill="url(#fortuneGradient)" />
          ))}

          {/* 라인 */}
          <path
            d={path}
            fill="none"
            stroke="oklch(0.76 0.14 80)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 점들 */}
          {points.map((p, i) => {
            if (p.score === null) return null;
            const x = PAD_X + i * xStep;
            const y = yFor(p.score);
            const isLast = i === n - 1;
            return (
              <g key={p.date}>
                <circle
                  cx={x}
                  cy={y}
                  r={isLast ? 4 : 2.4}
                  fill="oklch(0.76 0.14 80)"
                  stroke="var(--card)"
                  strokeWidth={isLast ? 2 : 1}
                />
                <title>{`${p.date}: ${p.score}점`}</title>
              </g>
            );
          })}
        </svg>

        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="평균" value={trend.average} />
          <Stat label="최고" value={trend.max} />
          <Stat label="최저" value={trend.min} />
        </dl>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({
  delta,
  label,
}: {
  delta: number | null;
  label: string;
}) {
  let Icon = Minus;
  let tone = "bg-muted/40 text-muted-foreground";
  if (delta !== null) {
    if (delta > 0) {
      Icon = TrendingUp;
      tone = "bg-accent/15 text-accent";
    } else if (delta < 0) {
      Icon = TrendingDown;
      tone = "bg-destructive/10 text-destructive";
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
        tone,
      )}
      aria-label={`어제 대비 ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/30 px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
        {label}
      </dt>
      <dd className="font-mystic text-base font-semibold tabular-nums">
        {value !== null ? `${value}점` : "—"}
      </dd>
    </div>
  );
}
