"use client";

import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { CompatibilityReading } from "@/db/schema";
import { cn, formatKoreanDate } from "@/lib/utils";

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
  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {dateStr}
          </span>
          <ScoreBadge score={reading.score} />
        </div>
        <p className="font-mystic text-base flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" aria-hidden />
          <span>{reading.partnerName}</span>
          <span className="text-xs text-muted-foreground font-normal">
            ({reading.partnerBirthDate})
          </span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-mystic text-lg leading-relaxed font-medium">
          {reading.summary}
        </p>
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/85">
          {reading.detail}
        </p>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const t = useTranslations("compatibilityCard");
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
      aria-label={t("scoreAria", { n: score })}
    >
      {t("scoreSuffix", { n: score })}
    </span>
  );
}
