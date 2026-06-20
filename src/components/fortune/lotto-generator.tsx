"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

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

/**
 * 연금복권 720+ 형식: 1~5조 + 6자리 번호.
 * 로또와 다른 시드를 써서 같은 운세 안에서도 별도 기운으로 고정한다.
 */
function generatePensionLottery(
  score: number,
  luckyNumber: number | null,
): { group: number; digits: number[] } {
  const seed = score * 1543 + (luckyNumber ?? 0) * 79 + 720;
  const rand = makePrng(seed);
  const group = Math.floor(rand() * 5) + 1;
  const digits = Array.from({ length: 6 }, () => Math.floor(rand() * 10));

  return { group, digits };
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
  const pensionLottery = generatePensionLottery(fortune.score, fortune.luckyNumber);
  const t = useTranslations("lottoCard");
  const tPrem = useTranslations("premiumCard");

  return (
    <Card className="app-surface relative overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-[15px] font-medium uppercase tracking-wider text-accent">
            {tPrem("lightBadge")}
          </span>
        </div>
        <h2 className="font-mystic text-xl font-semibold leading-snug tracking-tight">
          {t("title")}
        </h2>
        <p className="text-[15px] text-muted-foreground">
          {t("subtitle")}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {subscribed ? (
          <>
            <div className="space-y-3">
              <p className="text-center font-mystic text-base font-semibold text-foreground/90">
                {t("lottoSectionTitle")}
              </p>
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
                    aria-label={t("luckyNumberAria", { n })}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4">
              <div className="space-y-1 text-center">
                <p className="font-mystic text-base font-semibold text-foreground/90">
                  {t("pensionTitle")}
                </p>
                <p className="text-[15px] text-muted-foreground">
                  {t("pensionSubtitle")}
                </p>
              </div>
              <div
                className={cn(
                  "flex flex-wrap items-center justify-center gap-2 transition-all duration-500",
                  revealed ? "scale-100 opacity-100" : "scale-95 opacity-0",
                )}
                aria-label={t("pensionAria", {
                  group: pensionLottery.group,
                  numbers: pensionLottery.digits.join(""),
                })}
              >
                <span className="rounded-full border border-amber-300/45 bg-amber-200/20 px-3 py-2 font-mystic text-lg font-bold text-foreground">
                  {t("pensionGroup", { group: pensionLottery.group })}
                </span>
                <span className="text-muted-foreground">-</span>
                {pensionLottery.digits.map((digit, i) => (
                  <span
                    key={`${digit}-${i}`}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 font-mystic text-lg font-bold shadow-sm"
                    style={{
                      transitionDelay: revealed ? `${(i + 6) * 70}ms` : "0ms",
                    }}
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            {!revealed ? (
              <div className="flex justify-center">
                <Button
                  onClick={() => setRevealed(true)}
                  size="lg"
                  className="gap-2 font-mystic"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {t("getCta")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-[15px] text-muted-foreground">
                  {t("fixedNote", { score: fortune.score })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealed(false)}
                  className="text-[15px]"
                >
                  {t("againCta")}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* 비구독자 잠금 UI */
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4">
                <p className="font-mystic text-base font-semibold text-foreground/90">
                  {t("lottoSectionTitle")}
                </p>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  {t("lottoLockedPreview")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4">
                <p className="font-mystic text-base font-semibold text-foreground/90">
                  {t("pensionTitle")}
                </p>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  {t("pensionLockedPreview")}
                </p>
              </div>
            </div>
            <div className="rounded-full bg-muted/60 p-4">
              <Lock className="h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-mystic text-base font-medium">
                {t("lockedTitle")}
              </p>
              <p className="text-[15px] text-muted-foreground">
                {t("lockedBody")}
              </p>
            </div>
            <Button asChild className="gap-2 font-mystic">
              <Link href={ROUTES.pricing}>
                <Crown className="h-4 w-4" aria-hidden />
                {t("lockedCta")}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
