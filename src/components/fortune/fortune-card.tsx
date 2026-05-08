import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ShareButton } from "@/components/shared/share-button";
import type { DailyFortune } from "@/db/schema";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FortuneCardProps {
  fortune: DailyFortune;
}

const CATEGORY_LABEL: Record<FortuneCategoryId, string> = Object.fromEntries(
  FORTUNE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<FortuneCategoryId, string>;

export function FortuneCard({ fortune }: FortuneCardProps) {
  const label = CATEGORY_LABEL[fortune.category as FortuneCategoryId] ?? "운세";

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <ScoreBadge score={fortune.score} />
        </div>
        <h2 className="font-mystic text-2xl font-semibold leading-snug tracking-tight">
          {fortune.title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
          {fortune.content}
        </p>

        <div className="grid grid-cols-1 gap-3 border-t border-border/40 pt-4 text-sm sm:grid-cols-3">
          <LuckyItem
            icon={<Sparkles className="h-4 w-4" aria-hidden />}
            label="행운의 색"
            value={fortune.luckyColor ?? "—"}
          />
          <LuckyItem label="행운의 수" value={String(fortune.luckyNumber ?? "—")} />
          <LuckyItem label="행운의 방향" value={fortune.luckyDirection ?? "—"} />
        </div>

        <div className="flex justify-end">
          <ShareButton
            title={`오늘의 ${label}: ${fortune.title}`}
            text={`[${label}] ${fortune.score}점\n${fortune.title}\n\n${fortune.content}\n\n행운: ${fortune.luckyColor ?? "—"} / ${fortune.luckyNumber ?? "—"} / ${fortune.luckyDirection ?? "—"}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-accent/40 bg-accent/15 text-accent"
      : score >= 50
        ? "border-primary/40 bg-primary/15 text-primary"
        : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-0.5 font-mystic text-sm font-medium",
        tone,
      )}
      aria-label={`운세 점수 ${score}점`}
    >
      {score}점
    </span>
  );
}

function LuckyItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/45 bg-card/35 px-3 py-3 text-center shadow-sm">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="mt-1 block font-mystic font-medium">{value}</span>
    </div>
  );
}
