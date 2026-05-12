"use client";

import { useState, useTransition } from "react";
import { Lock, Sparkles, Loader2, Clock, Radar, ListChecks } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateGeneralPremiumAction } from "@/app/(dashboard)/today/actions";
import type { GeneralFortunePremiumOutput } from "@/lib/ai/types";

interface GeneralPremiumProps {
  subscribed: boolean;
}

/** 레이더 차트 6개 영역 정의. */
const RADAR_AREAS = [
  { key: "fortune", label: "종합" },
  { key: "love", label: "사랑" },
  { key: "money", label: "재물" },
  { key: "career", label: "직장" },
  { key: "health", label: "건강" },
  { key: "study", label: "학업" },
] as const;

/** 레이더 차트 SVG 상수. */
const RADAR_CONFIG = {
  CENTER_X: 100,
  CENTER_Y: 100,
  MAX_RADIUS: 65,
  LABEL_RATIO: 1.22,
  BG_RATIOS: [0.25, 0.5, 0.75, 1.0] as const,
  ANGLE_STEP: (2 * Math.PI) / 6,
  START_ANGLE: -Math.PI / 2,
} as const;

interface RadarPoint {
  x: number;
  y: number;
}

/**
 * 6각형 레이더 차트의 N번째 꼭짓점 좌표를 계산한다.
 *
 * @param index 0~5 — 위쪽부터 시계방향 순서
 * @param ratio 0~1 — 중심점에서의 거리 비율
 */
function getRadarPoint(index: number, ratio: number): RadarPoint {
  const { CENTER_X, CENTER_Y, MAX_RADIUS, ANGLE_STEP, START_ANGLE } =
    RADAR_CONFIG;
  const angle = START_ANGLE + index * ANGLE_STEP;
  return {
    x: CENTER_X + MAX_RADIUS * ratio * Math.cos(angle),
    y: CENTER_Y + MAX_RADIUS * ratio * Math.sin(angle),
  };
}

/** 좌표 배열을 SVG path 문자열(`M…L…Z`)로 변환한다. */
function pointsToPath(points: readonly RadarPoint[]): string {
  return (
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ") + " Z"
  );
}

/**
 * 6영역 점수(0~100)를 정육각형 SVG 레이더 차트로 표시한다.
 *
 * 외부 라이브러리 없이 순수 JSX 로 구성한다.
 */
function RadarChart({
  scores,
}: {
  scores: GeneralFortunePremiumOutput["scores"];
}) {
  const { CENTER_X, CENTER_Y, BG_RATIOS, LABEL_RATIO } = RADAR_CONFIG;

  const dataPoints: RadarPoint[] = RADAR_AREAS.map((area, i) => {
    const score = scores[area.key];
    const ratio = Math.max(0, Math.min(100, score)) / 100;
    return getRadarPoint(i, ratio);
  });

  const dataPath = pointsToPath(dataPoints);

  const labelPoints: RadarPoint[] = RADAR_AREAS.map((_, i) =>
    getRadarPoint(i, LABEL_RATIO),
  );

  return (
    <svg
      viewBox="0 0 200 200"
      className="mx-auto w-full max-w-[220px]"
      role="img"
      aria-label="6개 영역 운세 점수 레이더 차트"
    >
      {/* 배경 동심 다각형 */}
      {BG_RATIOS.map((r) => {
        const pts = RADAR_AREAS.map((_, i) => getRadarPoint(i, r));
        return (
          <path
            key={r}
            d={pointsToPath(pts)}
            fill="none"
            stroke="rgba(251,191,36,0.15)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* 축선 */}
      {RADAR_AREAS.map((_, i) => {
        const outer = getRadarPoint(i, 1.0);
        return (
          <line
            key={i}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={outer.x.toFixed(1)}
            y2={outer.y.toFixed(1)}
            stroke="rgba(251,191,36,0.15)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* 데이터 폴리곤 — 골드 반투명 */}
      <path
        d={dataPath}
        fill="rgba(251,191,36,0.25)"
        stroke="rgba(251,191,36,0.9)"
        strokeWidth={1.5}
      />

      {/* 데이터 포인트 */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="rgba(251,191,36,1)"
        />
      ))}

      {/* 라벨 */}
      {RADAR_AREAS.map((area, i) => {
        const lp = labelPoints[i]!;
        const score = scores[area.key];
        return (
          <text
            key={area.key}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: "9px",
              fontFamily: "var(--font-sans)",
              fill: "rgba(251,191,36,0.85)",
            }}
          >
            {area.label} {score}
          </text>
        );
      })}
    </svg>
  );
}

/** 비라이트 사용자에게 보여주는 잠금 미리보기 항목들. */
const LOCKED_PREVIEW_ITEMS = [
  "시간대별 운세 — 오전·오후·저녁 기운 분석",
  "운세 레이더 차트 — 6영역 점수 한눈에 보기",
  "오늘의 DO/DON'T — 해야 할 것·피해야 할 것",
] as const;

/**
 * 종합 운세 라이트 카드.
 *
 * - 비라이트: 잠금 미리보기 + 라이트 유도 CTA.
 * - 라이트 + 미생성: "리포트 받기" 버튼.
 * - 라이트 + 생성됨: 시간대별 / 레이더 차트 / DO·DON'T 3개 섹션.
 */
export function GeneralPremium({ subscribed }: GeneralPremiumProps) {
  const [data, setData] = useState<GeneralFortunePremiumOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateGeneralPremiumAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      } else {
        setError(result.message ?? "오류가 발생했어.");
      }
    });
  }

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" aria-hidden />
            오늘의 종합 운세 리포트
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              라이트
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="pointer-events-none select-none space-y-2 blur-[3px]">
            {LOCKED_PREVIEW_ITEMS.map((t) => (
              <div key={t} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-accent/30" />
                <p className="text-sm font-medium">{t}</p>
              </div>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              라이트로 확인하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            오늘의 종합 운세 리포트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            시간대별 기운, 6영역 운세 차트, 오늘의 DO/DON&#39;T 까지 — 종합 운세
            라이트 리포트를 만들어줄게.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                분석 중…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                리포트 받기
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
          오늘의 종합 운세 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ① 시간대별 운세 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            시간대별 운세
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {data.timeSlots.map((slot, i) => {
              const pct = Math.max(0, Math.min(100, slot.score));
              return (
                <div
                  key={i}
                  className="space-y-2 rounded-xl border border-border/40 bg-card/40 p-3"
                >
                  <p className="text-[10px] text-muted-foreground">
                    {slot.label}
                  </p>
                  <p className="font-mystic text-sm font-bold text-primary">
                    {slot.keyword}
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    {slot.advice}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ② 운세 레이더 차트 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Radar className="h-4 w-4 text-primary" aria-hidden />
            운세 레이더 차트
          </h3>
          <RadarChart scores={data.scores} />
        </section>

        {/* ③ DO / DON'T */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="h-4 w-4 text-primary" aria-hidden />
            오늘의 DO / DON&#39;T
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-emerald-400">
                오늘 해야 할 것
              </p>
              {data.doList.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0 text-xs text-emerald-400">
                    •
                  </span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-400">
                오늘 피해야 할 것
              </p>
              {data.dontList.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0 text-xs text-red-400">
                    •
                  </span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
