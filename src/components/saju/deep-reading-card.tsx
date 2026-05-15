"use client";

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
import { useTranslations } from "next-intl";

import { CharacterImage } from "@/components/shared/character-image";
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
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  tone: string;
}> = [
  { key: "personality", titleKey: "section1Title", descKey: "section1Sub", icon: Brain,       tone: "text-primary" },
  { key: "strengths",   titleKey: "section2Title", descKey: "section2Sub", icon: TrendingUp,  tone: "text-accent" },
  { key: "cautions",    titleKey: "section3Title", descKey: "section3Sub", icon: Sparkles,    tone: "text-destructive" },
  { key: "loveStyle",   titleKey: "section4Title", descKey: "section4Sub", icon: Heart,       tone: "text-primary" },
  { key: "careerFit",   titleKey: "section5Title", descKey: "section5Sub", icon: Briefcase,   tone: "text-accent" },
  { key: "healthCare",  titleKey: "section6Title", descKey: "section6Sub", icon: HeartPulse,  tone: "text-primary" },
  { key: "lifeFlow",    titleKey: "section7Title", descKey: "section7Sub", icon: Map,         tone: "text-accent" },
];

export function DeepReadingCard({ reading }: DeepReadingCardProps) {
  const charId = getTodayCharacter();
  const character = CHARACTERS[charId];
  const t = useTranslations("deepReading");
  const tChar = useTranslations("characters");
  const charName = tChar(`${charId}.name`);
  const charTitle = tChar(`${charId}.title`);

  return (
    <div className="space-y-4">
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden />
              <CardTitle className="font-mystic text-xl">{t("heading")}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-md flex-shrink-0">
                <CharacterImage character={character} fill className="object-cover object-top" sizes="56px" quality={90} />
              </div>
              <div>
                <p className="font-mystic text-[15px] font-semibold text-foreground">{charName}</p>
                <p className="text-[15px] text-muted-foreground">{charTitle}</p>
              </div>
            </div>
          </div>
          <CardDescription>
            {t("intro")}
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
                {t(s.titleKey as "section1Title" | "section2Title" | "section3Title" | "section4Title" | "section5Title" | "section6Title" | "section7Title")}
                <span className="text-[15px] text-muted-foreground/70 font-normal">
                  {t(s.descKey as "section1Sub" | "section2Sub" | "section3Sub" | "section4Sub" | "section5Sub" | "section6Sub" | "section7Sub")}
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
  const t = useTranslations("deepReading");
  const PILLARS: Array<{
    label: string;
    stem: string;
    branch: string | null;
  }> = [
    { label: t("pillarYear"),  stem: breakdown.yearStem,        branch: breakdown.yearBranch },
    { label: t("pillarMonth"), stem: breakdown.monthStem,       branch: breakdown.monthBranch },
    { label: t("pillarDay"),   stem: breakdown.dayStem,         branch: breakdown.dayBranch },
    { label: t("pillarHour"),  stem: breakdown.hourStem ?? "",  branch: breakdown.hourBranch ?? null },
  ];

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Compass className="h-5 w-5 text-accent" aria-hidden />
          {t("eightChars")}
          <span className="text-[15px] text-muted-foreground/70 font-normal">
            {t("whyEight")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {PILLARS.map(({ label, stem, branch }) => {
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
              </div>
              {stem && (
                <div className="space-y-0.5">
                  <p className="text-[15px] uppercase tracking-widest text-muted-foreground/65">
                    {t("stemRevealed")}
                  </p>
                  <p className="font-mystic whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
                    {stem}
                  </p>
                </div>
              )}
              {branch && (
                <div className="space-y-0.5 pt-1">
                  <p className="text-[15px] uppercase tracking-widest text-muted-foreground/65">
                    {t("branchHidden")}
                  </p>
                  <p className="font-mystic whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
                    {branch}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {breakdown.summary && (
          <div className="space-y-1 border-t border-white/5 pt-4">
            <p className="text-[15px] uppercase tracking-widest text-muted-foreground/65">
              {t("eightSummary")}
            </p>
            <p className="font-mystic whitespace-pre-line text-[15px] leading-relaxed text-foreground/90 italic">
              {breakdown.summary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
