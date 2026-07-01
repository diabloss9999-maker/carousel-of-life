"use client";

import {
  CalendarDays,
  Compass,
  Heart,
  HeartHandshake,
  MessageCircle,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useLocale } from "next-intl";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CompatibilityReading } from "@/db/schema";
import { parseCompatibilityDetail } from "@/lib/compatibility/detail";
import { safeReadingText, safeShortText } from "@/lib/content/safety";
import { breakSentences, cn, formatKoreanDate } from "@/lib/utils";

interface CompatibilityCardProps {
  reading: CompatibilityReading;
}

export function CompatibilityCard({ reading }: CompatibilityCardProps) {
  const locale = useLocale();
  const dateStr =
    locale === "en"
      ? new Date(reading.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : formatKoreanDate(new Date(reading.createdAt));

  const detailPayload = parseCompatibilityDetail(reading.detail);
  const partnerName = safeShortText(reading.partnerName, "상대");
  const summary = safeReadingText(
    reading.summary,
    "두 사람의 관계 흐름을 다시 정리해볼게요.",
  );
  const detail = safeReadingText(
    detailPayload.basic,
    "상대의 리듬과 나의 표현 방식이 어떻게 맞물리는지 천천히 살펴보면 좋아요.",
  );
  const pro = detailPayload.pro;
  const partnerMeta = [
    reading.partnerBirthDate,
    reading.partnerBirthTime
      ? `${reading.partnerBirthTime.slice(0, 5)} 출생`
      : "출생 시간 모름",
    reading.partnerMbti?.toUpperCase(),
  ].filter(Boolean);
  const partnerWithParticle = withParticle(partnerName, "과", "와");
  const tone = scoreTone(reading.score);

  return (
    <Card className="app-surface overflow-hidden ring-1 ring-accent/15">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {dateStr}
          </span>
          <ScoreBadge score={reading.score} />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent">
              <HeartHandshake className="h-4 w-4" aria-hidden />
              관계 궁합 리포트
            </p>
            <div className="space-y-1">
              <h3 className="font-mystic text-2xl font-semibold leading-tight">
                {partnerWithParticle}의 흐름
              </h3>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
                {partnerMeta.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" aria-hidden />
                    {item}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <ScoreRing score={reading.score} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className={cn("rounded-2xl border px-4 py-3", tone.panel)}>
          <div className="flex items-center gap-2">
            <Sparkles
              className={cn("h-4 w-4 shrink-0", tone.icon)}
              aria-hidden
            />
            <p className="text-[12px] font-semibold">{tone.label}</p>
          </div>
          <p className="mt-2 font-mystic text-[17px] font-medium leading-7">
            {summary}
          </p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-[12px] font-semibold text-primary">
            <Heart className="h-4 w-4" aria-hidden />
            관계에서 보이는 신호
          </p>
          <p className="whitespace-pre-line font-mystic text-[15px] leading-7 text-foreground/85">
            {breakSentences(detail)}
          </p>
        </div>

        {pro ? (
          <div className="space-y-4 rounded-3xl border border-primary/20 bg-primary/[0.055] p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Pro Deep Report
                </p>
                <p className="mt-1 font-mystic text-[17px] font-semibold leading-7">
                  {safeShortText(
                    pro.summary,
                    "관계의 속도와 대화 방식을 정리해보세요.",
                  )}
                </p>
              </div>
            </div>

            <ProSection
              icon={HeartHandshake}
              title="관계 패턴"
              body={pro.relationshipPattern}
            />
            <ProSection
              icon={Heart}
              title="끌리는 지점"
              body={pro.attractionPoint}
            />
            <ProSection
              icon={Compass}
              title="부딪히는 이유"
              body={pro.conflictPattern}
            />
            <ProSection
              icon={MessageCircle}
              title="대화 가이드"
              body={pro.conversationGuide}
            />
            <ProSection
              icon={CalendarDays}
              title="속도와 타이밍"
              body={pro.timingAdvice}
            />
            <ProSection
              icon={Target}
              title="30일 관계 전략"
              body={pro.thirtyDayPlan}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProSection({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-border/45 bg-background/50 px-4 py-3">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[13px] font-semibold">{title}</p>
      </div>
      <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-foreground/85">
        {breakSentences(safeReadingText(body))}
      </p>
    </div>
  );
}

function withParticle(
  word: string,
  consonantParticle: string,
  vowelParticle: string,
): string {
  const last = word.trim().at(-1);
  if (!last) return word;
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangul) return `${word}${vowelParticle}`;
  return `${word}${(code - 0xac00) % 28 === 0 ? vowelParticle : consonantParticle}`;
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const style = {
    background: `conic-gradient(hsl(var(--accent)) ${clamped * 3.6}deg, hsl(var(--muted)) 0deg)`,
  };

  return (
    <div
      className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-1"
      style={style}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-background/95 text-center">
        <span className="font-mystic text-2xl font-semibold leading-none">
          {clamped}
        </span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-accent/30 bg-accent/15 text-accent"
      : score >= 50
        ? "border-primary/30 bg-primary/15 text-primary"
        : "border-destructive/20 bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 font-mystic text-[13px] font-medium",
        tone,
      )}
      aria-label={`궁합 점수 ${score}점`}
    >
      {score}점
    </span>
  );
}

function scoreTone(score: number): {
  label: string;
  icon: string;
  panel: string;
} {
  if (score >= 80) {
    return {
      label: "편하게 가까워질 수 있는 흐름",
      icon: "text-accent",
      panel: "border-accent/25 bg-accent/[0.08]",
    };
  }
  if (score >= 50) {
    return {
      label: "맞춰가면 좋아지는 흐름",
      icon: "text-primary",
      panel: "border-primary/25 bg-primary/[0.07]",
    };
  }
  return {
    label: "거리 조절이 중요한 흐름",
    icon: "text-destructive",
    panel: "border-destructive/20 bg-destructive/[0.06]",
  };
}
