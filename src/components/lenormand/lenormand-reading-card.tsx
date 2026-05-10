import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LenormandReading } from "@/db/schema";
import { LENORMAND_BY_ID } from "@/lib/lenormand/cards";

interface Props {
  reading: LenormandReading;
}

interface CardEntry {
  id: number;
  position: string;
}

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

export function LenormandReadingCard({ reading }: Props) {
  const cards = (Array.isArray(reading.cards) ? reading.cards : []).filter(
    isCardEntry,
  );

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-3">
        {/* 카드 이미지 영역 */}
        <div className="flex flex-wrap justify-center gap-3">
          {cards.map((entry) => {
            const card = LENORMAND_BY_ID[entry.id];
            if (!card) return null;
            return (
              <div
                key={`${entry.position}-${entry.id}`}
                className="flex flex-col items-center gap-1"
              >
                <div className="relative aspect-[2/3] w-20 overflow-hidden rounded-xl border border-border/40 sm:w-24">
                  <Image
                    src={card.imageSrc}
                    alt={card.nameKo}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {POSITION_LABEL[entry.position] ?? entry.position}
                </p>
              </div>
            );
          })}
        </div>
        {reading.question ? (
          <p className="text-center text-xs text-muted-foreground">
            “{reading.question}”
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
          {reading.interpretation}
        </p>
        <p className="text-right text-xs text-muted-foreground">
          {new Date(reading.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </CardContent>
    </Card>
  );
}
