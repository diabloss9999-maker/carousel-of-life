"use client";

import {
  CalendarDays,
  Heart,
  HeartHandshake,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useLocale } from "next-intl";

import { ContinueWithMemberCta } from "@/components/chat/continue-with-member-cta";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CompatibilityReading } from "@/db/schema";
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

  const partnerName = safeShortText(reading.partnerName, "상대");
  const summary = safeReadingText(
    reading.summary,
    "두 사람의 관계 흐름을 다시 정리해볼게요.",
  );
  const detail = safeReadingText(
    reading.detail,
    "상대의 리듬과 나의 표현 방식이 어떻게 맞물리는지 천천히 살펴보면 좋아요.",
  );
  const partnerMeta = [
    reading.partnerBirthDate,
    reading.partnerBirthTime
      ? `${reading.partnerBirthTime.slice(0, 5)} 출생`
      : "출생 시간 모름",
    reading.partnerMbti?.toUpperCase(),
  ].filter(Boolean);
  const partnerWithParticle = withParticle(partnerName, "과", "와");
  const tone = scoreTone(reading.score);
  const prompt = `${partnerWithParticle}의 궁합 결과를 봤어. 이 관계에서 오늘 내가 어떻게 다가가면 좋을지 같이 정리해줘.`;
  const contextSummary = `${partnerName} 궁합 ${reading.score}점. ${summary}`.slice(
    0,
    120,
  );

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

      <CardContent className="space-y-4">
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

        <ContinueWithMemberCta
          sourceLabel="궁합"
          prompt={prompt}
          contextTitle={`${partnerName}와의 궁합`}
          contextSummary={contextSummary}
        />
      </CardContent>
    </Card>
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
