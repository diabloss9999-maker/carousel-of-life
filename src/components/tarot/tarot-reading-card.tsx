import { getLocale, getTranslations } from "next-intl/server";

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

interface TarotReadingCardProps {
  reading: TarotReading;
}

interface DrawnCardJson {
  id: string;
  nameKo: string;
  nameEn: string;
  isReversed: boolean;
}

function asDrawnCards(cards: unknown): DrawnCardJson[] {
  if (Array.isArray(cards)) return cards as DrawnCardJson[];
  return [];
}

export async function TarotReadingCard({ reading }: TarotReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const card = cards[0];
  const t = await getTranslations("tarotForm");
  const tChar = await getTranslations("characters");
  const tCardTabs = await getTranslations("cardTabs");
  const locale = await getLocale();

  const readDate = reading.createdAt instanceof Date
    ? reading.createdAt.toISOString().slice(0, 10)
    : String(reading.createdAt).slice(0, 10);
  const charId = getTodayCharacter(readDate);
  const character = CHARACTERS[charId];
  const charName = tChar(`${charId}.name`);
  const charTitle = tChar(`${charId}.title`);

  const localeDateStr = new Date(reading.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "ko-KR",
    locale === "en"
      ? { year: "numeric", month: "short", day: "numeric" }
      : undefined,
  );
  const cardName = card
    ? locale === "en" && card.nameEn
      ? card.nameEn
      : card.nameKo
    : tCardTabs("tarot");
  const orient = card?.isReversed ? t("reversedBadge") : t("uprightBadge");
  const dateForFile = new Date(reading.createdAt).toISOString().slice(0, 10);

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-md flex-shrink-0">
              <CharacterImage character={character} fill className="object-cover object-top" sizes="56px" quality={90} />
            </div>
            <div>
              <p className="font-mystic text-sm font-semibold text-foreground">{charName}</p>
              <p className="text-xs text-muted-foreground">{charTitle}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {localeDateStr}
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
                card:     cardName,
                reversed: String(card?.isReversed ?? false),
                summary:  reading.interpretation.slice(0, 60),
                spread:   locale === "en" ? "1 card" : "한 장",
                date:     localeDateStr,
                locale,
              })}`}
              filename={t("shareFilename", { date: dateForFile })}
            />
            <ShareButton
              title={t("shareTitleOne", { card: cardName })}
              text={t("shareTextOne", {
                card: cardName,
                orient,
                summary: reading.interpretation,
              }) + (reading.question ? `\n\nQ. ${reading.question}` : "")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
