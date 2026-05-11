
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { LuckyInfo } from "@/components/fortune/lucky-info";
import { SaveImageButton } from "@/components/shared/save-image-button";
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

  /** 공유 이미지 API URL 생성 */
  function buildShareImageUrl(): string {
    const base = "/api/share/fortune";
    const params = new URLSearchParams({
      title:     fortune.title,
      score:     String(fortune.score ?? 70),
      category:  label,
      content:   fortune.content.slice(0, 80),
      ...(fortune.luckyColor     && { color:     fortune.luckyColor }),
      ...(fortune.luckyNumber    && { number:    String(fortune.luckyNumber) }),
      ...(fortune.luckyDirection && { direction: fortune.luckyDirection }),
      date: new Date(fortune.createdAt).toLocaleDateString("ko-KR"),
    });
    return `${base}?${params.toString()}`;
  }

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

        <LuckyInfo
          color={fortune.luckyColor ?? null}
          number={fortune.luckyNumber ?? null}
          direction={fortune.luckyDirection ?? null}
        />

        <div className="flex items-center justify-end gap-2">
          <SaveImageButton
            imageUrl={buildShareImageUrl()}
            filename={`인생의회전목마_${label}_${new Date(fortune.createdAt).toLocaleDateString("ko-KR").replace(/\./g, "").replace(/\s/g, "")}`}
          />
          <ShareButton
            title={`오늘의 ${label}: ${fortune.title}`}
            text={`[${label}] ${fortune.title}\n\n${fortune.content}\n\n행운: ${fortune.luckyColor ?? "—"} / ${fortune.luckyNumber ?? "—"} / ${fortune.luckyDirection ?? "—"}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
