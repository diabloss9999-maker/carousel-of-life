import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CharacterImage } from "@/components/shared/character-image";
import type { LenormandReading } from "@/db/schema";
import { LENORMAND_BY_ID } from "@/lib/lenormand/cards";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
import { cn } from "@/lib/utils";

interface Props {
  reading: LenormandReading;
}

interface CardEntry {
  id: number;
  position: string;
}

/** id 가 시그니피케이터(28=신사 / 29=숙녀)인지 판별. */
const SIG_IDS = new Set([28, 29]);

function isCardEntry(v: unknown): v is CardEntry {
  return (
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    "position" in v &&
    typeof (v as { id: unknown }).id === "number" &&
    typeof (v as { position: unknown }).position === "string"
  );
}

const POSITION_LABEL: Record<string, string> = {
  single: "오늘의 메시지",
  past: "과거",
  present: "현재",
  future: "미래",
};

/**
 * 9장(3×3) 카드 위치 라벨.
 */
function nineLabel(idx: number): string {
  if (idx === 4) return "핵심";
  if (idx < 3) return "과거";
  if (idx < 6) return "현재";
  return "미래";
}

export function LenormandReadingCard({ reading }: Props) {
  const cards = (Array.isArray(reading.cards) ? reading.cards : []).filter(
    isCardEntry,
  );
  const spreadType = reading.spreadType;
  const readDate = reading.createdAt instanceof Date
    ? reading.createdAt.toISOString().slice(0, 10)
    : String(reading.createdAt).slice(0, 10);
  const charId = getTodayCharacter(readDate);
  const character = CHARACTERS[charId];

  return (
    <Card className="app-surface">
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
        {/* 카드 레이아웃 — 스프레드별 분기 */}
        {spreadType === "nine" ? (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
              {cards.map((entry, i) => {
                const card = LENORMAND_BY_ID[entry.id];
                if (!card) return null;
                const isCenter = i === 4;
                return (
                  <div
                    key={`nine-${i}-${entry.id}`}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-0.5",
                      isCenter && "ring-2 ring-amber-400/60",
                    )}
                  >
                    <div className="relative w-32 sm:w-36 aspect-[2/3] overflow-hidden rounded-xl border border-border/40">
                      <Image
                        src={card.imageSrc}
                        alt={card.nameKo}
                        fill
                        className="object-cover"
                        sizes="(max-width:640px) 128px, 144px"
                      />
                    </div>
                    <p className="text-center text-[15px] text-muted-foreground">{nineLabel(i)}</p>
                    <p className="text-center text-[15px] font-medium text-foreground/80">{card.nameKo}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : spreadType === "grand_tableau" ? (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <div className="grid min-w-[480px] grid-cols-8 gap-1">
                {cards.slice(0, 32).map((entry, i) => {
                  const card = LENORMAND_BY_ID[entry.id];
                  if (!card) return null;
                  const isSig = SIG_IDS.has(entry.id);
                  return (
                    <div
                      key={`gt-${i}-${entry.id}`}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg p-0.5",
                        isSig && "ring-2 ring-amber-400",
                      )}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border/30">
                        <Image
                          src={card.imageSrc}
                          alt={card.nameKo}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 12vw, 80px"
                        />
                      </div>
                      <p className="text-center text-[15px] text-muted-foreground">
                        {card.nameKo}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            {cards.length > 32 ? (
              <div className="border-t border-border/30 pt-2">
                <p className="mb-1 text-center text-[15px] text-muted-foreground">
                  🌙 영혼 카드
                </p>
                <div className="mx-auto grid max-w-[220px] grid-cols-4 gap-1">
                  {cards.slice(32).map((entry, i) => {
                    const card = LENORMAND_BY_ID[entry.id];
                    if (!card) return null;
                    const isSig = SIG_IDS.has(entry.id);
                    return (
                      <div
                        key={`soul-${i}-${entry.id}`}
                        className={cn(
                          "flex flex-col items-center gap-0.5 rounded-md p-0.5",
                          isSig && "ring-2 ring-amber-400",
                        )}
                      >
                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-purple-400/30">
                          <Image
                            src={card.imageSrc}
                            alt={card.nameKo}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 22vw, 100px"
                          />
                        </div>
                        <p className="text-center text-[15px] text-muted-foreground">
                          {card.nameKo}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {cards.map((entry) => {
              const card = LENORMAND_BY_ID[entry.id];
              if (!card) return null;
              return (
                <div
                  key={`${entry.position}-${entry.id}`}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative w-52 sm:w-64 aspect-[2/3] overflow-hidden rounded-xl border border-white/20 shadow-[0_22px_60px_rgb(0_0_0/0.22)]">
                    <Image
                      src={card.imageSrc}
                      alt={card.nameKo}
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 208px, 256px"
                    />
                  </div>
                  <p className="text-[15px] text-muted-foreground">
                    {POSITION_LABEL[entry.position] ?? entry.position}
                  </p>
                </div>
              );
            })}
          </div>
        )}
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
