"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Heart, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LoveCardProps {
  fortune: DailyFortune;
  subscribed: boolean;
}

const KEYWORDS = [
  "설렘",
  "용기",
  "인연",
  "표현",
  "신뢰",
  "배려",
  "열정",
  "안정",
  "변화",
  "끌림",
  "따뜻함",
  "진심",
  "기회",
  "솔직함",
  "연결",
  "포용",
  "감사",
  "달콤함",
  "기다림",
  "조화",
];

const ACTIONS = [
  "오늘은 먼저 연락해봐요",
  "기다리기보다 마음을 표현해봐요",
  "그 사람의 이야기를 진심으로 들어줘요",
  "작은 것으로 관심을 표현해봐요",
  "솔직한 마음을 전할 때가 됐어요",
  "잠시 여유를 두고 기다려봐요",
  "함께하는 시간을 만들어봐요",
  "진심 어린 칭찬 한마디를 건네봐요",
  "오늘은 설레는 감정을 즐겨봐요",
  "먼저 다가가는 용기를 내봐요",
];

function makePrng(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function pickItems<T>(arr: T[], count: number, rand: () => number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    result.push(pool.splice(idx, 1)[0]!);
  }
  return result;
}

function generateLoveCard(score: number, luckyNumber: number | null) {
  const seed = score * 997 + (luckyNumber ?? 0) * 31 + 777;
  const rand = makePrng(seed);
  const keywords = pickItems(KEYWORDS, 3, rand);
  const action = ACTIONS[Math.floor(rand() * ACTIONS.length)]!;
  return { keywords, action };
}

export function LoveCard({ fortune, subscribed }: LoveCardProps) {
  const [flipped, setFlipped] = useState(false);
  const { keywords, action } = generateLoveCard(fortune.score, fortune.luckyNumber);

  return (
    <Card className="app-surface relative overflow-hidden">
      <style>{`
        .lv-scene {
          perspective: 900px;
          width: 100%;
          min-height: 240px;
        }
        .lv-card {
          position: relative;
          width: 100%;
          min-height: 240px;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
        }
        .lv-card.flipped {
          transform: rotateY(180deg);
        }
        .lv-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .lv-back {
          transform: rotateY(180deg);
        }
      `}</style>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider text-accent">프리미엄</span>
        </div>
        <h2 className="font-mystic text-xl font-semibold leading-snug tracking-tight">
          사랑의 행운 카드
        </h2>
        <p className="text-sm text-muted-foreground">
          오늘의 사랑운이 담긴 세 가지 키워드와 조언을 확인해봐요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscribed ? (
          <>
            <div className="lv-scene">
              <div className={cn("lv-card", flipped && "flipped")}>
                {/* Front */}
                <div className="lv-face bg-gradient-to-br from-rose-950/60 via-pink-900/40 to-purple-950/60 text-center gap-3">
                  <div className="rounded-full bg-rose-500/20 p-4">
                    <Heart className="h-10 w-10 text-rose-400" aria-hidden />
                  </div>
                  <p className="font-mystic text-base text-rose-200">카드를 뒤집어봐요</p>
                  <p className="text-xs text-rose-300/60">오늘의 사랑 메시지가 담겨 있어요</p>
                </div>
                {/* Back */}
                <div className="lv-face lv-back bg-gradient-to-br from-pink-950/60 via-rose-900/40 to-fuchsia-950/60 gap-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    {keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-rose-500/25 px-4 py-1.5 font-mystic text-sm font-medium text-rose-200 ring-1 ring-rose-400/30"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="w-full border-t border-rose-500/20" />
                  <div className="flex items-start gap-2 text-center">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                    <p className="font-mystic text-sm text-rose-100">{action}</p>
                  </div>
                </div>
              </div>
            </div>
            {!flipped ? (
              <div className="flex justify-center">
                <Button
                  onClick={() => setFlipped(true)}
                  size="lg"
                  className="gap-2 font-mystic"
                >
                  <Heart className="h-4 w-4" aria-hidden />
                  카드 뒤집기
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-muted-foreground">
                  사랑운 {fortune.score}점 기반 · 오늘 하루 고정된 카드예요
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlipped(false)}
                  className="text-xs"
                >
                  다시 보기
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-muted/60 p-4">
              <Lock className="h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-mystic text-base font-medium">프리미엄 전용 기능이에요</p>
              <p className="text-sm text-muted-foreground">
                구독하면 사랑운 키워드와 오늘의 조언을 매일 받을 수 있어요.
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
