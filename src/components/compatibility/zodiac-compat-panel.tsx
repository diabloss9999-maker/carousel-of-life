"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ZODIAC_LIST, type ZodiacSign } from "@/lib/fortunes/zodiac";
import {
  getZodiacCompat,
  type ZodiacCompatResult,
} from "@/lib/compatibility/zodiac-compat";
import { cn } from "@/lib/utils";

interface ZodiacCompatPanelProps {
  myZodiac: ZodiacSign;
}

export function ZodiacCompatPanel({ myZodiac }: ZodiacCompatPanelProps) {
  const [partner, setPartner] = useState<ZodiacSign | null>(null);
  const locale = useLocale();
  const compatLocale = locale === "en" ? "en" : "ko";
  const result: ZodiacCompatResult | null = partner
    ? getZodiacCompat(myZodiac, partner, compatLocale)
    : null;

  const myInfo = ZODIAC_LIST.find((z) => z.id === myZodiac)!;
  const t = useTranslations("zodiacCompat");
  const tName = useTranslations("zodiacName");
  const tDate = useTranslations("zodiacDateRange");

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          {t("heading")}
        </CardTitle>
        <CardDescription className="text-[15px]">
          {t("yourSignIs", { sign: tName(myInfo.id) })} · {t("pickPartner")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {ZODIAC_LIST.map((z) => {
            const selected = partner === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setPartner(z.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-[15px] transition-all",
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-card/40 hover:-translate-y-0.5 hover:bg-card/80",
                )}
                aria-pressed={selected}
              >
                <span className="block font-medium">{tName(z.id)}</span>
                <span className="mt-1 block text-[15px] text-muted-foreground">
                  {tDate(z.id)}
                </span>
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl app-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-mystic text-[15px] text-muted-foreground">
                {tName(result.me.id)} × {tName(result.partner.id)}
              </p>
              <ScoreBadge score={result.score} />
            </div>
            <p className="font-mystic text-base font-medium leading-relaxed">
              {result.headline}
            </p>
            <p className="font-mystic whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
              {result.detail}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-[15px] text-muted-foreground">
            {t("pickPartner")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const t = useTranslations("zodiacCompat");
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-0.5 font-mystic text-[15px] font-medium",
        tone,
      )}
    >
      {t("score", { n: score })}
    </span>
  );
}
