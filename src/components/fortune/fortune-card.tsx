
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ShareButton } from "@/components/shared/share-button";
import type { DailyFortune } from "@/db/schema";
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "@/lib/constants";

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
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <h2 className="font-mystic text-2xl font-semibold leading-snug tracking-tight">
          {fortune.title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
          {fortune.content}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <LuckyItem label="행운의 색" value={fortune.luckyColor ?? "—"} />
          <span className="text-border/60">·</span>
          <LuckyItem label="행운의 수" value={String(fortune.luckyNumber ?? "—")} />
          <span className="text-border/60">·</span>
          <LuckyItem label="행운의 방향" value={fortune.luckyDirection ?? "—"} />
        </div>

        <div className="flex justify-end">
          <ShareButton
            title={`오늘의 ${label}: ${fortune.title}`}
            text={`[${label}] ${fortune.title}\n\n${fortune.content}\n\n행운: ${fortune.luckyColor ?? "—"} / ${fortune.luckyNumber ?? "—"} / ${fortune.luckyDirection ?? "—"}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LuckyItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-mystic font-semibold text-foreground/90">{value}</span>
    </span>
  );
}
