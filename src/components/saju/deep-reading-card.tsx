import { CharacterImage } from "@/components/shared/character-image";
import {
  Brain,
  Briefcase,
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
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

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
    title: "성격",
    desc: "타고난 결",
    icon: Brain,
    tone: "text-primary",
  },
  {
    key: "strengths",
    title: "강점",
    desc: "빛이 나는 자리",
    icon: TrendingUp,
    tone: "text-accent",
  },
  {
    key: "cautions",
    title: "조심할 점",
    desc: "기운이 약한 부분",
    icon: Sparkles,
    tone: "text-destructive",
  },
  {
    key: "loveStyle",
    title: "사랑",
    desc: "연애 스타일",
    icon: Heart,
    tone: "text-primary",
  },
  {
    key: "careerFit",
    title: "일",
    desc: "잘 풀리는 분야",
    icon: Briefcase,
    tone: "text-accent",
  },
  {
    key: "healthCare",
    title: "건강",
    desc: "관리 포인트",
    icon: HeartPulse,
    tone: "text-primary",
  },
  {
    key: "lifeFlow",
    title: "인생 흐름",
    desc: "큰 그림",
    icon: Map,
    tone: "text-accent",
  },
];

export function DeepReadingCard({ reading }: DeepReadingCardProps) {
  const charId = getTodayCharacter();
  const character = CHARACTERS[charId];

  return (
    <div className="space-y-4">
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden />
              <CardTitle className="font-mystic text-xl">심층 분석</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-md flex-shrink-0">
                <CharacterImage character={character} fill className="object-cover object-top" sizes="56px" quality={90} />
              </div>
              <div>
                <p className="font-mystic text-sm font-semibold text-foreground">{character.name}</p>
                <p className="text-xs text-muted-foreground">{character.title}</p>
              </div>
            </div>
          </div>
          <CardDescription>
            한 번 적힌 풀이는 평생 곁에 있어. 마음에 담아두고 가끔 다시 펼쳐봐.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 사주 8글자 — 각 글자가 왜 나왔고 무엇을 상징하는지 */}
      {reading.pillarBreakdown && (
        <PillarBreakdownCard breakdown={reading.pillarBreakdown} />
      )}

      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.key}
            className="app-surface"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-mystic flex items-center gap-2 text-lg">
                <Icon className={`h-5 w-5 ${s.tone}`} aria-hidden />
                {s.title}
                <span className="text-xs text-muted-foreground/70 font-normal">
                  {s.desc}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
                {reading[s.key]}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 사주 8글자 분해 — 각 글자별 도출 근거 + 상징 + 의미
// ════════════════════════════════════════════════════════════════════════════

interface PillarBreakdownCardProps {
  breakdown: NonNullable<SajuDeepReading["pillarBreakdown"]>;
}

function PillarBreakdownCard({ breakdown }: PillarBreakdownCardProps) {
  const PILLARS: Array<{
    label: string;
    sub: string;
    stem: string;
    branch: string | null;
  }> = [
    { label: "년주", sub: "조상 · 뿌리 · 사회적 배경", stem: breakdown.yearStem, branch: breakdown.yearBranch },
    { label: "월주", sub: "부모 · 청년기 · 사회 자리", stem: breakdown.monthStem, branch: breakdown.monthBranch },
    { label: "일주", sub: "본인 · 배우자 · 중년의 자리", stem: breakdown.dayStem, branch: breakdown.dayBranch },
    { label: "시주", sub: "씨앗 · 말년 · 자녀", stem: breakdown.hourStem ?? "", branch: breakdown.hourBranch ?? null },
  ];

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Compass className="h-5 w-5 text-accent" aria-hidden />
          여덟 글자의 결
          <span className="text-xs text-muted-foreground/70 font-normal">
            각 글자가 왜 나왔는가
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {PILLARS.map(({ label, sub, stem, branch }) => {
          const hasContent = !!stem || !!branch;
          if (!hasContent) return null;
          return (
            <div
              key={label}
              className="space-y-2 rounded-xl border border-white/10 bg-white/3 p-4"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mystic font-bold text-base text-accent">
                  {label}
                </span>
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">
                  {sub}
                </span>
              </div>
              {stem && (
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/65">
                    천간 — 드러난 결
                  </p>
                  <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                    {stem}
                  </p>
                </div>
              )}
              {branch && (
                <div className="space-y-0.5 pt-1">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/65">
                    지지 — 감춰진 결
                  </p>
                  <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                    {branch}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {breakdown.summary && (
          <div className="space-y-1 border-t border-white/5 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/65">
              여덟 글자 종합
            </p>
            <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/90 italic">
              {breakdown.summary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
