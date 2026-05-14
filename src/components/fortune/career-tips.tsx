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
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateCareerTipsAction } from "@/app/(dashboard)/today/actions";
import type { CareerReportOutput } from "@/lib/ai/types";

interface CareerTipsProps {
  subscribed: boolean;
}

/** KST 기준 요일 index 0~6 (Sun=0). */
function getTodayWeekdayIdxKst(): number {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  return d.getDay();
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
 * 직장 운세 라이트 전용 — 4개 섹션 종합 리포트 카드.
 *
 * - 비라이트 사용자: 흐릿한 미리보기 + 라이트 유도 CTA를 표시한다.
 * - 라이트 + 미생성: "리포트 받기" 버튼을 표시한다.
 * - 라이트 + 생성됨: 4개 섹션(에너지/타이밍/주간흐름/관계운) + 팁 3가지를 표시한다.
 */
export function CareerTips({ subscribed }: CareerTipsProps) {
  const [report, setReport] = useState<CareerReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("careerReport");
  const tPrem = useTranslations("premiumCard");

  const lockBullets = [
    t("lockBullet1"),
    t("lockBullet2"),
    t("lockBullet3"),
    t("lockBullet4"),
    t("lockBullet5"),
  ];

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCareerTipsAction();
      if (result.kind === "success" && result.report) {
        setReport(result.report);
      } else {
        setError(result.message ?? tPrem("genericError"));
      }
    });
  }

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" aria-hidden />
            {t("title")}
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              {tPrem("lightBadge")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 select-none blur-[3px] pointer-events-none">
            {lockBullets.map((line) => (
              <div key={line} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 rounded-full bg-accent/30 flex-shrink-0" />
                <p className="text-sm font-medium">{line}</p>
              </div>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {tPrem("verifyCta")}
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
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("lockBody")}
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
                {tPrem("analyzing")}
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {tPrem("getReport")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const todayIdx = getTodayWeekdayIdxKst();
  const weekdays = t.raw("weekdays") as string[];
  const todayWeekdayLabel = weekdays[todayIdx];
  const periodLabel =
    report.timing.period === "morning" ? t("periodMorning") : t("periodAfternoon");

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ① 에너지 리포트 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-primary" aria-hidden />
            {t("energy")}
          </h3>
          <div className="space-y-2.5">
            {[
              { label: t("energyFocus"), value: report.energy.focus },
              { label: t("energyRelation"), value: report.energy.relations },
              { label: t("energyDrive"), value: report.energy.drive },
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
            <span className="font-semibold text-destructive">{t("avoid")} </span>
            {report.energy.avoid}
          </div>
        </section>

        {/* ② 최적 업무 타이밍 */}
        <section className="space-y-2">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            {t("timing")}
          </h3>
          <div className="rounded-md bg-primary/5 px-3 py-2.5">
            <p className="text-sm font-medium text-primary">
              {t("periodGood", { period: periodLabel })}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {report.timing.periodDesc}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold">{t("meetings")} </span>
            {report.timing.meetingTip}
          </p>
        </section>

        {/* ③ 이번 주 직장 흐름 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            {t("weekly")}
          </h3>
          <ul className="space-y-2">
            {report.weeklyFlow.map((item) => {
              const isToday = item.day === todayWeekdayLabel || item.day === ["일","월","화","수","목","금","토"][todayIdx];
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
            {t("relation")}
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
                {t("askGood")}
              </>
            ) : (
              <>
                <X className="h-4 w-4" aria-hidden />
                {t("askLater")}
              </>
            )}
          </div>
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">{t("boss")} </span>
              {report.relationship.bossAdvice}
            </li>
            <li>
              <span className="font-semibold text-foreground">{t("coworker")} </span>
              {report.relationship.colleagueTip}
            </li>
            <li>
              <span className="font-semibold text-foreground">{t("stand")} </span>
              {report.relationship.standoutTip}
            </li>
          </ul>
        </section>

        {/* ⑤ 직장에서 예쁨받는 방법 3가지 */}
        <section className="space-y-3">
          <h3 className="font-mystic flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            {t("loved")}
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
