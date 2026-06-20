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
  getChineseZodiacCompat,
  type ChineseZodiacCompatResult,
  type ChineseZodiacRelation,
} from "@/lib/compatibility/chinese-zodiac-compat";
import {
  CHINESE_ZODIAC_LIST,
  type ChineseZodiacSign,
} from "@/lib/fortunes/zodiac";
import { cn } from "@/lib/utils";

interface ChineseZodiacCompatPanelProps {
  myChineseZodiac: ChineseZodiacSign;
}

const RELATION_TONE: Record<ChineseZodiacRelation, string> = {
  samhap: "bg-accent/15 text-accent",
  yukhap: "bg-primary/15 text-primary",
  sangchung: "bg-destructive/10 text-destructive",
  self: "bg-muted/60 text-muted-foreground",
  general: "bg-muted/60 text-muted-foreground",
};

export function ChineseZodiacCompatPanel({
  myChineseZodiac,
}: ChineseZodiacCompatPanelProps) {
  const [partner, setPartner] = useState<ChineseZodiacSign | null>(null);
  const result: ChineseZodiacCompatResult | null = partner
    ? getChineseZodiacCompat(myChineseZodiac, partner)
    : null;

  const myInfo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === myChineseZodiac)!;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-accent" aria-hidden />
          띠 궁합
        </CardTitle>
        <CardDescription className="text-[15px]">
          내 띠는 {myInfo.ko}예요. 상대의 띠를 고르면 서로 잘 맞는 지점과
          조심할 지점을 함께 볼 수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CHINESE_ZODIAC_LIST.map((zodiac) => {
            const selected = partner === zodiac.id;
            return (
              <button
                key={zodiac.id}
                type="button"
                onClick={() => setPartner(zodiac.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-[15px] transition-all",
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-card/40 hover:-translate-y-0.5 hover:bg-card/80",
                  zodiac.id === myChineseZodiac && !selected && "ring-1 ring-accent/40",
                )}
                aria-pressed={selected}
              >
                <span className="block text-base">{zodiac.animal}</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  {zodiac.ko}
                </span>
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl app-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mystic text-[15px] text-muted-foreground">
                  {result.me.ko} × {result.partner.ko}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[13px] font-medium",
                    RELATION_TONE[result.relationKind],
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
            <p className="whitespace-pre-line font-mystic text-[15px] leading-relaxed text-foreground/85">
              {result.detail}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-[15px] text-muted-foreground">
            상대 띠를 선택하면 궁합 결과가 여기에 표시돼요.
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
        "rounded-full px-3 py-0.5 font-mystic text-[15px] font-medium",
        tone,
      )}
    >
      {score}점
    </span>
  );
}
