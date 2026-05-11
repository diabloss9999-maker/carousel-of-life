"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CHINESE_ZODIAC_LIST,
  type ChineseZodiacSign,
} from "@/lib/fortunes/zodiac";
import {
  getChineseZodiacCompat,
  type ChineseZodiacCompatResult,
} from "@/lib/compatibility/chinese-zodiac-compat";
import { cn } from "@/lib/utils";

interface ChineseZodiacCompatPanelProps {
  myChineseZodiac: ChineseZodiacSign;
}

/** 관계 유형 배지 색상. */
const RELATION_TONE: Record<string, string> = {
  삼합: "bg-accent/15 text-accent",
  육합: "bg-primary/15 text-primary",
  상충: "bg-destructive/10 text-destructive",
  동갑띠: "bg-muted/60 text-muted-foreground",
  일반: "bg-muted/60 text-muted-foreground",
};

export function ChineseZodiacCompatPanel({
  myChineseZodiac,
}: ChineseZodiacCompatPanelProps) {
  const [partner, setPartner] = useState<ChineseZodiacSign | null>(null);
  const result: ChineseZodiacCompatResult | null = partner
    ? getChineseZodiacCompat(myChineseZodiac, partner)
    : null;

  const myInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === myChineseZodiac)!;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-accent" aria-hidden />
          띠 궁합
        </CardTitle>
        <CardDescription className="text-xs">
          내 띠는 <strong>{myInfo.ko}</strong> · 상대의 띠를 골라봐.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CHINESE_ZODIAC_LIST.map((z) => {
            const selected = partner === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setPartner(z.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-sm transition-all",
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-card/40 hover:-translate-y-0.5 hover:bg-card/80",
                  z.id === myChineseZodiac && !selected &&
                    "ring-1 ring-accent/40",
                )}
                aria-pressed={selected}
              >
                <span className="block text-base">{z.animal}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {z.ko}
                </span>
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mystic text-sm text-muted-foreground">
                  {result.me.ko} × {result.partner.ko}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    RELATION_TONE[result.relationType] ?? RELATION_TONE["일반"],
                  )}
                >
                  {result.relationType}
                </span>
              </div>
              <ScoreBadge score={result.score} />
            </div>
            <p className="font-mystic text-base font-medium leading-relaxed">
              {result.headline}
            </p>
            <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/85">
              {result.detail}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-sm text-muted-foreground">
            상대의 띠를 골라봐. 즉시 궁합 점수를 보여줄게.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-0.5 font-mystic text-sm font-medium",
        tone,
      )}
    >
      {score}점
    </span>
  );
}
