import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  CardOrientationBadge,
  TarotCardDisplay,
} from "@/components/tarot/tarot-card-display";
import { ShareButton } from "@/components/shared/share-button";
import type { TarotReading } from "@/db/schema";
import { formatKoreanDate } from "@/lib/utils";

interface TarotReadingCardProps {
  reading: TarotReading;
}

interface DrawnCardJson {
  id: string;
  nameKo: string;
  nameEn: string;
  isReversed: boolean;
}

/**
 * DB 의 cards jsonb 컬럼 타입.
 *
 * Drizzle jsonb 는 unknown 으로 추론되므로 좁혀준다.
 */
function asDrawnCards(cards: unknown): DrawnCardJson[] {
  if (Array.isArray(cards)) return cards as DrawnCardJson[];
  return [];
}

export function TarotReadingCard({ reading }: TarotReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const card = cards[0];

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {formatKoreanDate(new Date(reading.createdAt))}
        </p>
        {reading.question ? (
          <p className="font-mystic text-base text-foreground/80 italic">
            “{reading.question}”
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {card ? (
          <div className="flex flex-col items-center gap-3">
            <TarotCardDisplay
              id={card.id}
              nameKo={card.nameKo}
              nameEn={card.nameEn}
              isReversed={card.isReversed}
            />
            <CardOrientationBadge isReversed={card.isReversed} />
          </div>
        ) : null}

        <div className="border-t border-border/40 pt-6 space-y-4">
          <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
            {reading.interpretation}
          </p>
          <div className="flex justify-end">
            <ShareButton
              title={`타로 한 장: ${card?.nameKo ?? ""}`}
              text={`[타로] ${card?.nameKo ?? ""} (${card?.isReversed ? "거꾸로" : "바로 선"})${reading.question ? `\n\nQ. ${reading.question}` : ""}\n\n${reading.interpretation}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
