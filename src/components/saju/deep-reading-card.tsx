"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Brain,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Compass,
  Heart,
  HeartPulse,
  Map,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SajuDeepReading } from "@/lib/saju/deep-reading";
import { ROUTES } from "@/lib/constants";
import { safeReadingText } from "@/lib/content/safety";
import { breakSentences } from "@/lib/utils";

interface DeepReadingCardProps {
  reading: SajuDeepReading;
}

type TextSectionKey =
  | "personality"
  | "strengths"
  | "cautions"
  | "loveStyle"
  | "careerFit"
  | "healthCare"
  | "lifeFlow";

const SECTIONS: Array<{
  key: TextSectionKey;
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    key: "personality",
    title: "기본 성향",
    desc: "타고난 반응 방식",
    icon: Brain,
    tone: "text-primary",
  },
  {
    key: "strengths",
    title: "강점",
    desc: "잘 쓰면 힘이 되는 부분",
    icon: TrendingUp,
    tone: "text-accent",
  },
  {
    key: "cautions",
    title: "주의할 점",
    desc: "흔들리기 쉬운 패턴",
    icon: Sparkles,
    tone: "text-destructive",
  },
  {
    key: "loveStyle",
    title: "관계와 애정",
    desc: "마음이 움직이는 방식",
    icon: Heart,
    tone: "text-primary",
  },
  {
    key: "careerFit",
    title: "일과 역할",
    desc: "잘 맞는 방향",
    icon: Briefcase,
    tone: "text-accent",
  },
  {
    key: "healthCare",
    title: "컨디션",
    desc: "챙겨야 할 리듬",
    icon: HeartPulse,
    tone: "text-primary",
  },
  {
    key: "lifeFlow",
    title: "삶의 흐름",
    desc: "길게 볼 때의 방향",
    icon: Map,
    tone: "text-accent",
  },
];

export function DeepReadingCard({ reading }: DeepReadingCardProps) {
  const cleaned = {
    personality: safeReadingText(reading.personality),
    strengths: safeReadingText(reading.strengths),
    cautions: safeReadingText(reading.cautions),
    loveStyle: safeReadingText(reading.loveStyle),
    careerFit: safeReadingText(reading.careerFit),
    healthCare: safeReadingText(reading.healthCare),
    lifeFlow: safeReadingText(reading.lifeFlow),
  };
  const coreTrait = getFirstSentence(cleaned.personality);
  const coreStrength = getFirstSentence(cleaned.strengths);
  const coreCaution = getFirstSentence(cleaned.cautions);

  return (
    <div className="space-y-4">
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden />
              <CardTitle className="font-mystic text-xl">
                사주 심층 리포트
              </CardTitle>
            </div>
            <span className="rounded-full border border-accent/30 px-3 py-1 text-[15px] text-accent">
              심층 사주 노트
            </span>
          </div>
          <CardDescription>
            기본 명식에서 한 걸음 더 들어가 성향, 강점, 관계, 일의
            방향을 정리했어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <DeepSummaryTile icon={Brain} label="핵심 성향" value={coreTrait} />
            <DeepSummaryTile
              icon={TrendingUp}
              label="강점"
              value={coreStrength}
            />
            <DeepSummaryTile
              icon={Sparkles}
              label="주의할 점"
              value={coreCaution}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-[12px] font-semibold">오늘 적용 포인트</p>
            </div>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
              강점은 더 크게 쓰고, 주의할 점은 작게 조절하는 쪽이 좋아요.
              사주는 성격을 가두는 답이 아니라 오늘 선택을 정리하는
              기준으로 보면 가장 유용해요.
            </p>
          </div>
        </CardContent>
      </Card>

      {reading.pillarBreakdown ? (
        <PillarBreakdownCard breakdown={reading.pillarBreakdown} />
      ) : null}

      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.key} className="app-surface">
            <CardHeader className="pb-3">
              <CardTitle className="font-mystic flex items-center gap-2 text-lg">
                <Icon className={`h-5 w-5 ${s.tone}`} aria-hidden />
                {s.title}
                <span className="text-[15px] font-normal text-muted-foreground/70">
                  {s.desc}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line font-mystic leading-relaxed text-foreground/90">
                {breakSentences(cleaned[s.key])}
              </p>
            </CardContent>
          </Card>
        );
      })}

      <SajuNextActions />
    </div>
  );
}

function SajuNextActions() {
  return (
    <Card className="app-surface ring-1 ring-primary/15">
      <CardContent className="px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-primary">
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-[12px] font-semibold">사주를 생활로 이어보기</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <NextActionLink
            href={ROUTES.today}
            icon={CalendarDays}
            title="오늘운세"
            body="오늘 흐름에 바로 적용"
          />
          <NextActionLink
            href={ROUTES.compatibility}
            icon={Heart}
            title="궁합"
            body="관계 흐름까지 연결"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NextActionLink({
  body,
  href,
  icon: Icon,
  title,
}: {
  body: string;
  href: Route;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 transition hover:border-primary/30 hover:bg-white/[0.08]"
    >
      <span className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
      </span>
      <span className="mt-1.5 block text-[12px] leading-5 text-muted-foreground">
        {body}
      </span>
    </Link>
  );
}

function DeepSummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[12px] font-semibold">{label}</p>
      </div>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{value}</p>
    </div>
  );
}

function getFirstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?[.!?。！？])\s/);
  return match?.[1] ?? normalized.slice(0, 84);
}

interface PillarBreakdownCardProps {
  breakdown: NonNullable<SajuDeepReading["pillarBreakdown"]>;
}

function PillarBreakdownCard({ breakdown }: PillarBreakdownCardProps) {
  const pillars: Array<{
    label: string;
    stem: string;
    branch: string | null;
  }> = [
    { label: "년주", stem: breakdown.yearStem, branch: breakdown.yearBranch },
    { label: "월주", stem: breakdown.monthStem, branch: breakdown.monthBranch },
    { label: "일주", stem: breakdown.dayStem, branch: breakdown.dayBranch },
    {
      label: "시주",
      stem: breakdown.hourStem ?? "",
      branch: breakdown.hourBranch ?? null,
    },
  ];

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Compass className="h-5 w-5 text-accent" aria-hidden />
          여덟 글자 해석
          <span className="text-[15px] font-normal text-muted-foreground/70">
            명식이 만들어진 이유
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {pillars.map(({ label, stem, branch }) => {
          const safeStem = stem ? safeReadingText(stem) : "";
          const safeBranch = branch ? safeReadingText(branch) : null;
          const hasContent = !!safeStem || !!safeBranch;
          if (!hasContent) return null;
          return (
            <div
              key={label}
              className="space-y-2 rounded-xl border border-white/10 bg-white/3 p-4"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mystic text-base font-bold text-accent">
                  {label}
                </span>
              </div>
              {safeStem ? (
                <div className="space-y-0.5">
                  <p className="text-[15px] uppercase tracking-widest text-muted-foreground/65">
                    드러나는 기운
                  </p>
                  <p className="whitespace-pre-line font-mystic text-[15px] leading-relaxed text-foreground/85">
                    {breakSentences(safeStem)}
                  </p>
                </div>
              ) : null}
              {safeBranch ? (
                <div className="space-y-0.5 pt-1">
                  <p className="text-[15px] uppercase tracking-widest text-muted-foreground/65">
                    안쪽의 흐름
                  </p>
                  <p className="whitespace-pre-line font-mystic text-[15px] leading-relaxed text-foreground/85">
                    {breakSentences(safeBranch)}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}

        {breakdown.summary ? (
          <div className="space-y-1 border-t border-white/5 pt-4">
            <p className="text-[15px] uppercase tracking-widest text-muted-foreground/65">
              종합 요약
            </p>
            <p className="whitespace-pre-line font-mystic text-[15px] italic leading-relaxed text-foreground/90">
              {breakSentences(safeReadingText(breakdown.summary))}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
