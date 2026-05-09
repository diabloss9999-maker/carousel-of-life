"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LottoGeneratorProps {
  fortune: DailyFortune;
  subscribed: boolean;
}

/** Simple seeded LCG — same inputs always yield the same sequence. */
function makePrng(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

/**
 * 재산운 score + luckyNumber 를 시드로 1~45 에서 6개 중복 없이 선택.
 * 같은 운세 → 항상 같은 번호.
 */
function generateLottoNumbers(
  score: number,
  luckyNumber: number | null,
): number[] {
  const seed = score * 997 + (luckyNumber ?? 0) * 31 + 42;
  const rand = makePrng(seed);
  const pool = new Set<number>();

  // 행운의 수가 유효 범위면 첫 번째로 포함
  if (luckyNumber && luckyNumber >= 1 && luckyNumber <= 45) {
    pool.add(luckyNumber);
  }

  let guard = 0;
  while (pool.size < 6 && guard++ < 500) {
    pool.add(Math.floor(rand() * 45) + 1);
  }
  // 극히 드문 fallback
  for (let n = 1; pool.size < 6; n++) pool.add(n);

  return [...pool].sort((a, b) => a - b);
}

/** 한국 로또 볼 색상 (1-9 노랑 / 10-19 파랑 / 20-29 빨강 / 30-39 회색 / 40-45 초록). */
function ballColor(n: number): string {
  if (n <= 9) return "from-yellow-400 to-amber-500 text-gray-900";
  if (n <= 19) return "from-blue-500 to-blue-700 text-white";
  if (n <= 29) return "from-red-500 to-red-700 text-white";
  if (n <= 39) return "from-gray-500 to-gray-700 text-white";
  return "from-emerald-500 to-green-700 text-white";
}

export function LottoGenerator({ fortune, subscribed }: LottoGeneratorProps) {
  const [revealed, setRevealed] = useState(false);
  const numbers = generateLottoNumbers(fortune.score, fortune.luckyNumber);

  return (
    <Card className="app-surface relative overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider text-accent">
            프리미엄
          </span>
        </div>
        <h2 className="font-mystic text-xl font-semibold leading-snug tracking-tight">
          재산운 로또번호 생성기
        </h2>
        <p className="text-sm text-muted-foreground">
          오늘의 재산운 기운이 담긴 번호 6개를 뽑아드려요.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {subscribed ? (
          <>
            {/* 번호 볼 */}
            <div className="flex flex-wrap justify-center gap-3 py-2">
              {numbers.map((n, i) => (
                <div
                  key={n}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br",
                    "font-mystic text-lg font-bold shadow-md",
                    "transition-all duration-500",
                    ballColor(n),
                    revealed ? "scale-100 opacity-100" : "scale-50 opacity-0",
                  )}
                  style={{
                    transitionDelay: revealed ? `${i * 90}ms` : "0ms",
                  }}
                  aria-label={`로또 번호 ${n}`}
                >
                  {n}
                </div>
              ))}
            </div>

            {!revealed ? (
              <div className="flex justify-center">
                <Button
                  onClick={() => setRevealed(true)}
                  size="lg"
                  className="gap-2 font-mystic"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  오늘의 행운 번호 받기
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-muted-foreground">
                  재산운 {fortune.score}점 기반 · 오늘 하루 고정된 번호예요
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealed(false)}
                  className="text-xs"
                >
                  다시 보기
                </Button>
              </div>
            )}
          </>
        ) : (
          /* 비구독자 잠금 UI */
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-muted/60 p-4">
              <Lock className="h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-mystic text-base font-medium">
                프리미엄 전용 기능이에요
              </p>
              <p className="text-sm text-muted-foreground">
                구독하면 재산운으로 만든 로또번호를 매일 받을 수 있어요.
              </p>
            </div>
            <Button asChild className="gap-2 font-mystic">
              <Link href={ROUTES.pricing}>
                <Crown className="h-4 w-4" aria-hidden />
                프리미엄 시작하기
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
