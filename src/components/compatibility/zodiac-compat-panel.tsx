"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getZodiacCompat,
  type ZodiacCompatResult,
} from "@/lib/compatibility/zodiac-compat";
import { ZODIAC_LIST, type ZodiacSign } from "@/lib/fortunes/zodiac";
import { cn } from "@/lib/utils";

interface ZodiacCompatPanelProps {
  myZodiac: ZodiacSign;
}

export function ZodiacCompatPanel({ myZodiac }: ZodiacCompatPanelProps) {
  const [partner, setPartner] = useState<ZodiacSign | null>(null);
  const result: ZodiacCompatResult | null = partner
    ? getZodiacCompat(myZodiac, partner)
    : null;

  const myInfo = ZODIAC_LIST.find((zodiac) => zodiac.id === myZodiac)!;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          별자리 궁합
        </CardTitle>
        <CardDescription className="text-[15px]">
          내 별자리는 {myInfo.ko}예요. 상대의 별자리를 고르면 두 사람의
          리듬을 바로 비교해 볼 수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {ZODIAC_LIST.map((zodiac) => {
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
                )}
                aria-pressed={selected}
              >
                <span className="block font-medium">{zodiac.ko}</span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  {zodiac.dateRange}
                </span>
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl app-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-mystic text-[15px] text-muted-foreground">
                {result.me.ko} × {result.partner.ko}
              </p>
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
            상대 별자리를 선택하면 궁합 결과가 여기에 표시돼요.
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
