"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Heart, Sparkles, Sun, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { type FortuneCategoryId } from "@/lib/constants";
import {
  looksCorruptedText,
  safeReadingText,
  safeShortText,
} from "@/lib/content/safety";
import type { HistoryItem } from "@/lib/history/service";
import { cn, formatKoreanDate } from "@/lib/utils";

interface HistoryItemCardProps {
  item: HistoryItem;
  onDelete?: (item: HistoryItem) => Promise<void>;
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return formatKoreanDate(date);
}

export function HistoryItemCard({ item, onDelete }: HistoryItemCardProps) {
  const t = useTranslations("historyPage");
  const href = `/archive/${item.kind}/${item.data.id}` as Route;
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!onDelete || isDeleting) return;
    if (!confirm(t("deleteConfirm"))) return;

    setIsDeleting(true);
    try {
      await onDelete(item);
    } catch {
      alert(t("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card
      className={cn(
        "app-surface relative overflow-hidden transition",
        isDeleting && "opacity-60",
      )}
    >
      <Link href={href} className="block transition hover:opacity-90">
        {item.kind === "fortune" ? <FortuneRow item={item.data} /> : null}
        {item.kind === "tarot" ? <TarotRow item={item.data} /> : null}
        {item.kind === "compatibility" ? (
          <CompatibilityRow item={item.data} />
        ) : null}
      </Link>

      {onDelete ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition hover:border-destructive/40 hover:text-destructive disabled:cursor-wait disabled:opacity-50"
          aria-label={t("deleteRecord")}
          title={t("deleteRecord")}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </Card>
  );
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
    ? t(
        key as
          | "categoryGeneral"
          | "categoryLove"
          | "categoryWealth"
          | "categoryCareer"
          | "categoryHealth"
          | "categoryStudy"
          | "categoryZodiac"
          | "categoryChineseZodiac",
      )
    : tHist("itemFortune");
  const title = safeShortText(item.title, "오늘의 운세");
  const content = safeReadingText(item.content);

  return (
    <CardContent className="flex items-start gap-4 p-4 pr-14">
      <BadgeIcon icon={<Sun className="h-4 w-4" />} tone="primary" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="text-[15px] uppercase tracking-wide text-muted-foreground">
          {label} · {localizedDate(new Date(item.createdAt), locale)}
        </span>
        <p className="font-mystic font-medium leading-snug">{title}</p>
        <p className="line-clamp-2 text-[15px] text-muted-foreground">
          {content}
        </p>
      </div>
    </CardContent>
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
    ? (item.cards as Array<{
        nameKo: string;
        nameEn?: string | null;
        isReversed: boolean;
      }>)
    : [];
  const cardSummary =
    cards
      .map((card) => (locale === "en" && card.nameEn ? card.nameEn : card.nameKo))
      .map((name) => safeShortText(name, "타로 카드"))
      .join(", ") || "타로 카드";
  const spreadLabel =
    item.spreadType === "three" ? t("itemTarotThree") : t("itemTarotOne");
  const question =
    item.question && !looksCorruptedText(item.question) ? item.question : null;

  let preview = item.interpretation;
  if (item.spreadType === "three") {
    try {
      const parsed = JSON.parse(item.interpretation) as {
        summary?: string;
        synthesis?: string;
      };
      preview = parsed.summary ?? parsed.synthesis ?? item.interpretation;
    } catch {
      preview = item.interpretation;
    }
  }
  const safePreview = safeReadingText(preview);

  return (
    <CardContent className="flex items-start gap-4 p-4 pr-14">
      <BadgeIcon icon={<Sparkles className="h-4 w-4" />} tone="accent" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="text-[15px] uppercase tracking-wide text-muted-foreground">
          {spreadLabel} · {localizedDate(new Date(item.createdAt), locale)}
        </span>
        <p className="truncate font-mystic font-medium leading-snug">
          {cardSummary}
        </p>
        {question ? (
          <p className="text-[15px] italic text-muted-foreground/80">
            &ldquo;{question}&rdquo;
          </p>
        ) : null}
        <p className="line-clamp-2 text-[15px] text-muted-foreground">
          {safePreview}
        </p>
      </div>
    </CardContent>
  );
}

function CompatibilityRow({
  item,
}: {
  item: Extract<HistoryItem, { kind: "compatibility" }>["data"];
}) {
  const t = useTranslations("historyPage");
  const locale = useLocale();
  const partnerName = safeShortText(item.partnerName, "상대");
  const summary = safeReadingText(item.summary);

  return (
    <CardContent className="flex items-start gap-4 p-4 pr-14">
      <BadgeIcon icon={<Heart className="h-4 w-4" />} tone="primary" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="text-[15px] uppercase tracking-wide text-muted-foreground">
          {t("itemCompat", {
            date: localizedDate(new Date(item.createdAt), locale),
          })}
        </span>
        <p className="font-mystic font-medium leading-snug">
          {t("itemCompatTitle", { partner: partnerName })}
        </p>
        <p className="line-clamp-2 text-[15px] text-muted-foreground">
          {summary}
        </p>
      </div>
    </CardContent>
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
