"use client";

import { Heart, Sparkles, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/lib/history/service";
import {
  type FortuneCategoryId,
} from "@/lib/constants";
import { cn, formatKoreanDate } from "@/lib/utils";

interface HistoryItemCardProps {
  item: HistoryItem;
}

const CATEGORY_TKEY: Record<FortuneCategoryId, string> = {
  general: "categoryGeneral",
  love: "categoryLove",
  money: "categoryWealth",
  career: "categoryCareer",
  health: "categoryHealth",
  study: "categoryStudy",
  zodiac: "categoryZodiac",
  chinese_zodiac: "categoryChineseZodiac",
};

function localizedDate(date: Date, locale: string): string {
  if (locale === "en") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  return formatKoreanDate(date);
}

export function HistoryItemCard({ item }: HistoryItemCardProps) {
  if (item.kind === "fortune") return <FortuneRow item={item.data} />;
  if (item.kind === "tarot") return <TarotRow item={item.data} />;
  return <CompatibilityRow item={item.data} />;
}

function FortuneRow({
  item,
}: {
  item: Extract<HistoryItem, { kind: "fortune" }>["data"];
}) {
  const t = useTranslations("fortuneCard");
  const tHist = useTranslations("historyPage");
  const locale = useLocale();
  const key = CATEGORY_TKEY[item.category as FortuneCategoryId];
  const label = key
    ? t(key as "categoryGeneral" | "categoryLove" | "categoryWealth" | "categoryCareer" | "categoryHealth" | "categoryStudy" | "categoryZodiac" | "categoryChineseZodiac")
    : tHist("itemFortune");
  return (
    <Card className="app-surface">
      <CardContent className="p-4 flex items-start gap-4">
        <BadgeIcon icon={<Sun className="h-4 w-4" />} tone="primary" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] uppercase tracking-wide text-muted-foreground">
              {label} · {localizedDate(new Date(item.createdAt), locale)}
            </span>
          </div>
          <p className="font-mystic font-medium leading-snug">{item.title}</p>
          <p className="text-[15px] text-muted-foreground line-clamp-2">
            {item.content}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TarotRow({
  item,
}: {
  item: Extract<HistoryItem, { kind: "tarot" }>["data"];
}) {
  const t = useTranslations("historyPage");
  const locale = useLocale();
  const cards = Array.isArray(item.cards)
    ? (item.cards as Array<{ nameKo: string; nameEn?: string | null; isReversed: boolean }>)
    : [];
  const cardSummary = cards
    .map((c) => (locale === "en" && c.nameEn ? c.nameEn : c.nameKo))
    .join(", ");
  const spreadLabel = item.spreadType === "three" ? t("itemTarotThree") : t("itemTarotOne");

  // three 스프레드는 interpretation 이 JSON 이라 summary 만 추출.
  let preview = item.interpretation;
  if (item.spreadType === "three") {
    try {
      const parsed = JSON.parse(item.interpretation);
      preview = parsed.summary ?? parsed.synthesis ?? item.interpretation;
    } catch {
      // ignore
    }
  }

  return (
    <Card className="app-surface">
      <CardContent className="p-4 flex items-start gap-4">
        <BadgeIcon icon={<Sparkles className="h-4 w-4" />} tone="accent" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="text-[15px] uppercase tracking-wide text-muted-foreground">
            {spreadLabel} · {localizedDate(new Date(item.createdAt), locale)}
          </span>
          <p className="font-mystic font-medium leading-snug truncate">
            {cardSummary}
          </p>
          {item.question ? (
            <p className="text-[15px] italic text-muted-foreground/80">
              “{item.question}”
            </p>
          ) : null}
          <p className="text-[15px] text-muted-foreground line-clamp-2">{preview}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CompatibilityRow({
  item,
}: {
  item: Extract<HistoryItem, { kind: "compatibility" }>["data"];
}) {
  const t = useTranslations("historyPage");
  const locale = useLocale();
  return (
    <Card className="app-surface">
      <CardContent className="p-4 flex items-start gap-4">
        <BadgeIcon icon={<Heart className="h-4 w-4" />} tone="primary" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] uppercase tracking-wide text-muted-foreground">
              {t("itemCompat", { date: localizedDate(new Date(item.createdAt), locale) })}
            </span>
          </div>
          <p className="font-mystic font-medium leading-snug">
            {t("itemCompatTitle", { partner: item.partnerName })}
          </p>
          <p className="text-[15px] text-muted-foreground line-clamp-2">
            {item.summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BadgeIcon({
  icon,
  tone,
}: {
  icon: React.ReactNode;
  tone: "primary" | "accent";
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        tone === "primary"
          ? "bg-primary/15 text-primary"
          : "bg-accent/15 text-accent",
      )}
    >
      {icon}
    </div>
  );
}
