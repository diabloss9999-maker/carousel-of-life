import { CharacterImage } from "@/components/shared/character-image";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  CardOrientationBadge,
  TarotCardDisplay,
} from "@/components/tarot/tarot-card-display";
import { SaveImageButton } from "@/components/shared/save-image-button";
import { ShareButton } from "@/components/shared/share-button";
import type { TarotReading } from "@/db/schema";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
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
  const readDate = reading.createdAt instanceof Date
    ? reading.createdAt.toISOString().slice(0, 10)
    : String(reading.createdAt).slice(0, 10);
  const charId = getTodayCharacter(readDate);
  const character = CHARACTERS[charId];

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-7 overflow-hidden rounded-lg shadow-sm flex-shrink-0">
              <CharacterImage character={character} fill className="object-cover object-top" sizes="28px" />
            </div>
            <div>
              <p className="font-mystic text-xs font-semibold text-foreground/80">{character.name}</p>
              <p className="text-[10px] text-muted-foreground">{character.title}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatKoreanDate(new Date(reading.createdAt))}
          </p>
        </div>
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
          <div className="flex items-center justify-end gap-2">
            <SaveImageButton
              imageUrl={`/api/share/tarot?${new URLSearchParams({
                card:     card?.nameKo ?? "타로",
                reversed: String(card?.isReversed ?? false),
                summary:  reading.interpretation.slice(0, 60),
                spread:   "한 장",
                date:     new Date(reading.createdAt).toLocaleDateString("ko-KR"),
              })}`}
              filename={`인생의회전목마_타로_${card?.nameKo ?? ""}`}
            />
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
