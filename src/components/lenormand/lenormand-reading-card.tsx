/**
 * 르노르망 결과 카드 — 한 번의 점술 결과를 표시.
 *
 * 이미지는 추후 추가 예정. 지금은 카드 번호+이름 플레이스홀더로 표시.
 */
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
                <div className="relative aspect-[2/3] w-20 overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-amber-950/80 to-stone-950/90 sm:w-24">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                    <p className="font-mystic text-2xl text-amber-400/80">✦</p>
                    <p className="font-mystic text-center text-xs leading-tight text-amber-200/90">
                      {card.nameKo}
                    </p>
                    <p className="text-[10px] text-amber-400/50">
                      No.{card.id}
                    </p>
                  </div>
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
