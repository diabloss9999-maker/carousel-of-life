"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CHINESE_ZODIAC_LIST,
  type ChineseZodiacSign,
} from "@/lib/fortunes/zodiac";
import {
  getChineseZodiacCompat,
  type ChineseZodiacCompatResult,
  type ChineseZodiacRelation,
} from "@/lib/compatibility/chinese-zodiac-compat";
import { cn } from "@/lib/utils";

interface ChineseZodiacCompatPanelProps {
  myChineseZodiac: ChineseZodiacSign;
}

/** 관계 유형 enum → 배지 색상. */
const RELATION_TONE: Record<ChineseZodiacRelation, string> = {
  samhap: "bg-accent/15 text-accent",
  yukhap: "bg-primary/15 text-primary",
  sangchung: "bg-destructive/10 text-destructive",
  self: "bg-muted/60 text-muted-foreground",
  general: "bg-muted/60 text-muted-foreground",
};

const RELATION_TKEY = {
  samhap: "relSamhap",
  yukhap: "relYukhap",
  sangchung: "relSangchung",
  self: "relSameYear",
  general: "relGeneral",
} as const;

export function ChineseZodiacCompatPanel({
  myChineseZodiac,
}: ChineseZodiacCompatPanelProps) {
  const [partner, setPartner] = useState<ChineseZodiacSign | null>(null);
  const locale = useLocale();
  const compatLocale = locale === "en" ? "en" : "ko";
  const result: ChineseZodiacCompatResult | null = partner
    ? getChineseZodiacCompat(myChineseZodiac, partner, compatLocale)
    : null;

  const t = useTranslations("chineseCompat");
  const tName = useTranslations("chineseZodiacName");

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-accent" aria-hidden />
          {t("heading")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("body")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CHINESE_ZODIAC_LIST.map((z) => {
            const selected = partner === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setPartner(z.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-sm transition-all",
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-card/40 hover:-translate-y-0.5 hover:bg-card/80",
                  z.id === myChineseZodiac && !selected &&
                    "ring-1 ring-accent/40",
                )}
                aria-pressed={selected}
              >
                <span className="block text-base">{z.animal}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {tName(z.id)}
                </span>
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mystic text-sm text-muted-foreground">
                  {tName(result.me.id)} × {tName(result.partner.id)}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    RELATION_TONE[result.relationKind],
                  )}
                >
                  {t(RELATION_TKEY[result.relationKind])}
                </span>
              </div>
              <ScoreBadge score={result.score} />
            </div>
            <p className="font-mystic text-base font-medium leading-relaxed">
              {result.headline}
            </p>
            <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/85">
              {result.detail}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-sm text-muted-foreground">
            {t("body")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const t = useTranslations("chineseCompat");
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-0.5 font-mystic text-sm font-medium",
        tone,
      )}
    >
      {t("score", { n: score })}
    </span>
  );
}
