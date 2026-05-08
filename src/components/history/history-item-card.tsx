import { Heart, Sparkles, Sun } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/lib/history/service";
import {
  FORTUNE_CATEGORIES,
  type FortuneCategoryId,
} from "@/lib/constants";
import { cn, formatKoreanDate } from "@/lib/utils";

interface HistoryItemCardProps {
  item: HistoryItem;
}

const CATEGORY_LABEL: Record<FortuneCategoryId, string> = Object.fromEntries(
  FORTUNE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<FortuneCategoryId, string>;

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
  const label = CATEGORY_LABEL[item.category as FortuneCategoryId] ?? "운세";
  return (
    <Card className="app-surface">
      <CardContent className="p-4 flex items-start gap-4">
        <BadgeIcon icon={<Sun className="h-4 w-4" />} tone="primary" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {label} · {formatKoreanDate(new Date(item.createdAt))}
            </span>
            
          </div>
          <p className="font-mystic font-medium leading-snug">{item.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
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
  const cards = Array.isArray(item.cards)
    ? (item.cards as Array<{ nameKo: string; isReversed: boolean }>)
    : [];
  const cardSummary = cards.map((c) => c.nameKo).join(", ");
  const spreadLabel = item.spreadType === "three" ? "타로 3장" : "타로 한 장";

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
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {spreadLabel} · {formatKoreanDate(new Date(item.createdAt))}
          </span>
          <p className="font-mystic font-medium leading-snug truncate">
            {cardSummary}
          </p>
          {item.question ? (
            <p className="text-xs italic text-muted-foreground/80">
              “{item.question}”
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
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
  return (
    <Card className="app-surface">
      <CardContent className="p-4 flex items-start gap-4">
        <BadgeIcon icon={<Heart className="h-4 w-4" />} tone="primary" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              궁합 · {formatKoreanDate(new Date(item.createdAt))}
            </span>
            
          </div>
          <p className="font-mystic font-medium leading-snug">
            {item.partnerName}님과의 궁합
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
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

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mystic text-xs font-medium tabular-nums",
        tone,
      )}
    >
      {score}점
    </span>
  );
}
