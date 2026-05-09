"use client";

import { useState, useTransition } from "react";
import {
  Lock,
  Sparkles,
  Loader2,
  Zap,
  Clock,
  CalendarDays,
  Users,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateCareerTipsAction } from "@/app/(dashboard)/today/actions";
import type { CareerReportOutput } from "@/lib/ai/types";

interface CareerTipsProps {
  subscribed: boolean;
}

/** KST 기준 한글 요일 ("월"~"일"). */
function getTodayWeekdayKst(): string {
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  return WEEKDAYS[d.getDay()];
}

/**
 * 게이지 바 — 0~100 점수를 가로 막대로 표시한다.
 *
 * 동적 너비는 Tailwind JIT 가 빌드 타임에 추출할 수 없으므로
 * 예외적으로 인라인 style 의 width 속성을 사용한다.
 */
function Gauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-border/40"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/**
 * 직장 운세 프리미엄 전용 — 4개 섹션 종합 리포트 카드.
 *
 * - 비프리미엄 사용자: 흐릿한 미리보기 + 프리미엄 유도 CTA를 표시한다.
 * - 프리미엄 + 미생성: "리포트 받기" 버튼을 표시한다.
 * - 프리미엄 + 생성됨: 4개 섹션(에너지/타이밍/주간흐름/관계운) + 팁 3가지를 표시한다.
 */
export function CareerTips({ subscribed }: CareerTipsProps) {
  const [report, setReport] = useState<CareerReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCareerTipsAction();
      if (result.kind === "success" && result.report) {
        setReport(result.report);
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
            오늘의 직장 종합 리포트
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 select-none blur-[3px] pointer-events-none">
            {[
              "오늘의 직장 에너지 (집중력·대인관계·추진력)",
              "최적 업무 타이밍 — 오전 vs 오후",
              "이번 주 직장 흐름 (월~금)",
              "오늘의 관계 운 — 부탁·상사·동료 팁",
              "직장에서 예쁨받는 방법 3가지",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 rounded-full bg-accent/30 flex-shrink-0" />
                <p className="text-sm font-medium">{t}</p>
              </div>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              프리미엄으로 확인하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            오늘의 직장 종합 리포트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            오늘의 에너지·업무 타이밍·이번 주 흐름·관계 운까지, 직장 운세
            종합 리포트를 만들어줄게.
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

  const todayWeekday = getTodayWeekdayKst();
  const periodLabel = report.timing.period === "morning" ? "오전" : "오후";

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
          오늘의 직장 종합 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ① 에너지 리포트 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-primary" aria-hidden />
            오늘의 직장 에너지
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "집중력", value: report.energy.focus },
              { label: "대인관계", value: report.energy.relations },
              { label: "추진력", value: report.energy.drive },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <Gauge value={item.value} />
              </div>
            ))}
          </div>
          <div className="rounded-md bg-destructive/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-destructive">피하기 </span>
            {report.energy.avoid}
          </div>
        </section>

        {/* ② 최적 업무 타이밍 */}
        <section className="space-y-2">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            최적 업무 타이밍
          </h3>
          <div className="rounded-md bg-primary/5 px-3 py-2.5">
            <p className="text-sm font-medium text-primary">
              {periodLabel}이 좋아요
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {report.timing.periodDesc}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold">회의·협상 </span>
            {report.timing.meetingTip}
          </p>
        </section>

        {/* ③ 이번 주 직장 흐름 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            이번 주 직장 흐름
          </h3>
          <ul className="space-y-2">
            {report.weeklyFlow.map((item) => {
              const isToday = item.day === todayWeekday;
              return (
                <li
                  key={item.day}
                  className={
                    isToday
                      ? "rounded-md bg-primary/10 px-2 py-1.5 ring-1 ring-primary/30"
                      : "px-2 py-1.5"
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        isToday
                          ? "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                          : "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-border/60 text-[11px] font-medium text-muted-foreground"
                      }
                    >
                      {item.day}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={
                            isToday
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {item.forecast}
                        </span>
                        <span className="font-medium tabular-nums">
                          {item.score}
                        </span>
                      </div>
                      <Gauge value={item.score} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ④ 관계 운 */}
        <section className="space-y-2">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" aria-hidden />
            오늘의 관계 운
          </h3>
          <div
            className={
              report.relationship.isGoodToAsk
                ? "flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                : "flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground"
            }
          >
            {report.relationship.isGoodToAsk ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                부탁하기 좋은 날
              </>
            ) : (
              <>
                <X className="h-4 w-4" aria-hidden />
                부탁은 내일로 미루기
              </>
            )}
          </div>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">상사 </span>
              {report.relationship.bossAdvice}
            </li>
            <li>
              <span className="font-semibold text-foreground">동료 </span>
              {report.relationship.colleagueTip}
            </li>
            <li>
              <span className="font-semibold text-foreground">돋보임 </span>
              {report.relationship.standoutTip}
            </li>
          </ul>
        </section>

        {/* ⑤ 직장에서 예쁨받는 방법 3가지 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            직장에서 예쁨받는 방법
          </h3>
          <ol className="space-y-3">
            {report.tips.map((tip, i) => (
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
        </section>
      </CardContent>
    </Card>
  );
}
