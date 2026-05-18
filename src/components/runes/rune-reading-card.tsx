import Image from "next/image";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CharacterImage } from "@/components/shared/character-image";
import type { RuneReading } from "@/db/schema";
import { RUNE_BY_ID } from "@/lib/runes/cards";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
import { cn } from "@/lib/utils";

interface Props {
  reading: RuneReading;
}

interface RuneEntry {
  runeId: number;
  isReversed: boolean;
  position: string;
}

function isRuneEntry(v: unknown): v is RuneEntry {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.runeId === "number" &&
    typeof o.isReversed === "boolean" &&
    typeof o.position === "string"
  );
}

/** 단일 룬 셀 렌더링. */
function RuneCell({
  entry,
  size = "md",
  highlight = false,
}: {
  entry: RuneEntry;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
}) {
  const rune = RUNE_BY_ID[entry.runeId];
  if (!rune) return null;

  // lg(단장) 만 타로 단장처럼 한 단계 더 크고 강한 그림자.
  const widthClass =
    size === "lg"
      ? "w-52 sm:w-64"
      : size === "sm"
        ? "w-32 sm:w-36"
        : "w-44 sm:w-56";
  const cardStyles =
    size === "lg"
      ? "rounded-xl border border-white/20 shadow-[0_22px_60px_rgb(0_0_0/0.22)]"
      : "rounded-lg border border-border/40";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl p-0.5",
        highlight && "ring-2 ring-amber-400/60",
      )}
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden",
          cardStyles,
          widthClass,
        )}
      >
        <Image
          src={rune.imageSrc}
          alt={`${rune.name} (${rune.nameKo})`}
          fill
          className={cn("object-cover", entry.isReversed && "rotate-180")}
          sizes={size === "lg" ? "(max-width: 640px) 208px, 256px" : "(max-width: 640px) 176px, 224px"}
        />
      </div>
      <p className="text-center text-[15px] text-muted-foreground">
        {entry.position}
      </p>
      <p className="text-center text-[15px] font-medium text-foreground/80">
        {rune.symbol} {rune.nameKo}
        {entry.isReversed ? " ⤵" : ""}
      </p>
      {entry.isReversed ? (
        <span className="text-[15px] text-amber-300/80">역방향</span>
      ) : null}
    </div>
  );
}

export function RuneReadingCard({ reading }: Props) {
  const runes = (Array.isArray(reading.runes) ? reading.runes : []).filter(
    isRuneEntry,
  );
  const spreadType = reading.spreadType;
  const readDate = reading.createdAt instanceof Date
    ? reading.createdAt.toISOString().slice(0, 10)
    : String(reading.createdAt).slice(0, 10);
  const charId = getTodayCharacter(readDate);
  const character = CHARACTERS[charId];

  return (
    <Card className="app-surface" data-capture-root>
      <CardHeader className="space-y-3 pb-3">
        {/* 캐릭터 배지 */}
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-md flex-shrink-0">
            <CharacterImage character={character} fill className="object-cover object-top" sizes="56px" quality={90} />
          </div>
          <div>
            <p className="font-mystic text-[15px] font-semibold text-foreground">{character.name}</p>
            <p className="text-[15px] text-muted-foreground">{character.title}</p>
          </div>
        </div>
        {spreadType === "single" ? (
          <div className="flex justify-center">
            {runes[0] ? <RuneCell entry={runes[0]} size="lg" /> : null}
          </div>
        ) : spreadType === "three" ? (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {runes.map((entry, i) => (
              <RuneCell
                key={`three-${i}-${entry.runeId}`}
                entry={entry}
                size="md"
              />
            ))}
          </div>
        ) : spreadType === "five" ? (
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {runes.map((entry, i) => (
              <RuneCell
                key={`five-${i}-${entry.runeId}`}
                entry={entry}
                size="sm"
                highlight={i === 0}
              />
            ))}
          </div>
        ) : spreadType === "nine" ? (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {runes.map((entry, i) => (
              <RuneCell
                key={`nine-${i}-${entry.runeId}`}
                entry={entry}
                size="sm"
                highlight={i === 4}
              />
            ))}
          </div>
        ) : null}

        {reading.question ? (
          <p className="text-center text-[15px] text-muted-foreground">
            “{reading.question}”
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
          {reading.interpretation}
        </p>
        <p className="text-right text-[15px] text-muted-foreground">
          {new Date(reading.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </CardContent>
    </Card>
  );
}
