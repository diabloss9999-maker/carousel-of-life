import { ArrowRight, Clock, History, Sparkles } from "lucide-react";

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
import { parseThreeInterpretation } from "@/lib/tarot/service";
import { cn, formatKoreanDate } from "@/lib/utils";

interface TarotThreeReadingCardProps {
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

const POSITIONS = [
  { key: "past" as const, label: "과거", desc: "지나온 자리", icon: History },
  { key: "present" as const, label: "현재", desc: "머무는 자리", icon: Clock },
  {
    key: "future" as const,
    label: "미래",
    desc: "다가올 자리",
    icon: ArrowRight,
  },
];

export function TarotThreeReadingCard({ reading }: TarotThreeReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const parsed = parseThreeInterpretation(reading.interpretation);

  if (!parsed || cards.length < 3) {
    return null;
  }

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {formatKoreanDate(new Date(reading.createdAt))} · 3장 스프레드
        </p>
        {reading.question ? (
          <p className="font-mystic text-base text-foreground/80 italic">
            “{reading.question}”
          </p>
        ) : null}
        <p className="font-mystic text-lg font-medium leading-relaxed">
          {parsed.summary}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 3장 카드 + 각 위치 풀이 */}
        {/* 라벨 행 */}
        <div className="grid gap-6 md:grid-cols-3">
          {POSITIONS.map((pos) => {
            const Icon = pos.icon;
            return (
              <div key={pos.key} className="flex items-center justify-center gap-1.5 text-sm font-medium text-accent">
                <Icon className="h-4 w-4" aria-hidden />
                <span className="font-mystic">{pos.label}</span>
                <span className="text-xs text-muted-foreground/70 font-normal">{pos.desc}</span>
              </div>
            );
          })}
        </div>

        {/* 카드 이미지 행 — 동일 높이 고정 */}
        <div className="grid gap-6 md:grid-cols-3">
          {POSITIONS.map((pos, i) => {
            const card = cards[i];
            return (
              <div key={pos.key} className="flex flex-col items-center gap-2">
                <TarotCardDisplay
                  id={card.id}
                  nameKo={card.nameKo}
                  nameEn={card.nameEn}
                  isReversed={card.isReversed}
                  className="w-32 sm:w-36"
                />
                <CardOrientationBadge isReversed={card.isReversed} />
              </div>
            );
          })}
        </div>

        {/* 텍스트 행 — 같은 위치에서 시작 */}
        <div className="grid gap-6 md:grid-cols-3">
          {POSITIONS.map((pos) => (
            <p
              key={pos.key}
              className="font-mystic whitespace-pre-line leading-relaxed text-sm text-foreground/85"
            >
              {parsed[pos.key]}
            </p>
          ))}
        </div>

        {/* 종합 풀이 */}
        <div className="space-y-2 rounded-xl border border-accent/25 bg-accent/10 p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="font-mystic">종합 풀이</span>
          </div>
          <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
            {parsed.synthesis}
          </p>
        </div>

        <div className="flex justify-end">
          <ShareButton
            title={`타로 3장 스프레드: ${parsed.summary}`}
            text={`[타로 3장 — 과거·현재·미래]${reading.question ? `\nQ. ${reading.question}` : ""}\n\n핵심: ${parsed.summary}\n\n과거: ${parsed.past}\n\n현재: ${parsed.present}\n\n미래: ${parsed.future}\n\n종합: ${parsed.synthesis}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
