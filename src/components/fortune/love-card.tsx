"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES } from "@/lib/constants";

interface LoveCardProps {
  fortune: DailyFortune;
  subscribed: boolean;
}

const ROMAN = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];

const TAROT = [
  { id: 0, name: "바보", symbol: "🌟", bg: "#2d1a00", accent: "#f59e0b", meaning: "새로운 시작과 순수한 설렘", advice: "두려움 없이 감정에 솔직해져요. 지금은 뛰어들 때예요." },
  { id: 1, name: "마법사", symbol: "⚡", bg: "#1e0a3c", accent: "#a78bfa", meaning: "의지와 자신감으로 상대를 끌어당기는 힘", advice: "원하는 걸 분명히 표현하세요. 지금 당신에겐 그럴 능력이 있어요." },
  { id: 2, name: "여사제", symbol: "🌙", bg: "#0d1a40", accent: "#93c5fd", meaning: "직관과 내면의 지혜", advice: "머리보다 마음의 소리를 믿어요. 답은 이미 당신 안에 있어요." },
  { id: 3, name: "여황제", symbol: "🌹", bg: "#3b0a1f", accent: "#fb7185", meaning: "사랑과 풍요, 따뜻한 배려", advice: "자신을 먼저 사랑하세요. 그 온기가 상대방에게 자연스럽게 전해져요." },
  { id: 4, name: "황제", symbol: "👑", bg: "#2a1700", accent: "#fbbf24", meaning: "안정과 신뢰, 든든한 버팀목", advice: "신뢰를 먼저 쌓아요. 관계에 안전감을 줄 때 사랑은 더 깊어져요." },
  { id: 5, name: "교황", symbol: "🕊", bg: "#1a1a2e", accent: "#e2e8f0", meaning: "전통과 헌신, 깊은 약속", advice: "진지한 대화를 나눠봐요. 서로의 가치관을 나누는 게 관계를 깊게 해요." },
  { id: 6, name: "연인", symbol: "💞", bg: "#3b0a2a", accent: "#f472b6", meaning: "선택과 조화, 진정한 연결", advice: "마음을 열고 선택하세요. 진심 어린 연결이 기다리고 있어요." },
  { id: 7, name: "전차", symbol: "🏆", bg: "#0a1f3b", accent: "#38bdf8", meaning: "의지와 추진력으로 사랑을 향해", advice: "먼저 다가가는 용기를 내봐요. 적극성이 관계를 앞으로 나아가게 해요." },
  { id: 8, name: "힘", symbol: "🦁", bg: "#2a1000", accent: "#fb923c", meaning: "내면의 강인함과 부드러운 용기", advice: "인내심을 가지고 부드럽게 대해요. 진정한 힘은 온화함에서 나와요." },
  { id: 9, name: "은둔자", symbol: "🕯", bg: "#1a1a1a", accent: "#a3a3a3", meaning: "내면을 들여다보는 조용한 시간", advice: "혼자만의 시간도 필요해요. 자신을 알아야 상대도 알 수 있어요." },
  { id: 10, name: "운명의 수레바퀴", symbol: "☯", bg: "#002a2a", accent: "#2dd4bf", meaning: "변화와 새로운 인연의 순환", advice: "변화를 두려워 말아요. 지금 흐름은 좋은 방향으로 향하고 있어요." },
  { id: 11, name: "정의", symbol: "⚖", bg: "#0d1f2d", accent: "#94a3b8", meaning: "균형과 진실, 공정한 관계", advice: "솔직하고 균형 잡힌 관계를 만들어요. 진실은 늘 통해요." },
  { id: 12, name: "매달린 사람", symbol: "🍃", bg: "#0a2a1a", accent: "#4ade80", meaning: "잠시 멈추고 새로운 시각으로", advice: "서두르지 않아도 돼요. 다른 방식으로 바라보면 새로운 길이 보여요." },
  { id: 13, name: "죽음", symbol: "🦋", bg: "#1a0a2a", accent: "#c084fc", meaning: "끝이 아닌 새로운 변환의 시작", advice: "과거의 상처를 내려놓아요. 새로운 사랑의 형태가 시작되고 있어요." },
  { id: 14, name: "절제", symbol: "🌊", bg: "#0a1f2a", accent: "#22d3ee", meaning: "조화와 인내, 균형 잡힌 사랑", advice: "서두르지 않고 천천히 쌓아가요. 균형 잡힌 관계가 오래 가요." },
  { id: 15, name: "악마", symbol: "🔥", bg: "#2a0a0a", accent: "#f87171", meaning: "집착에서 벗어나 진정한 자유로", advice: "집착이나 두려움에서 자유로워져요. 진정한 연결은 자유로울 때 생겨요." },
  { id: 16, name: "탑", symbol: "🌩", bg: "#1a1a1a", accent: "#64748b", meaning: "갑작스런 변화가 새 토대를 만들어", advice: "예상치 못한 변화도 괜찮아요. 더 탄탄한 관계를 위한 과정이에요." },
  { id: 17, name: "별", symbol: "⭐", bg: "#0d0d2a", accent: "#818cf8", meaning: "희망과 치유, 빛나는 미래", advice: "희망을 품어요. 진정성 있는 모습이 가장 매력적이에요." },
  { id: 18, name: "달", symbol: "🌕", bg: "#14002a", accent: "#a78bfa", meaning: "감정의 깊이와 무의식의 소리", advice: "불안하더라도 감정을 억누르지 말아요. 솔직하게 느끼는 게 관계를 깊게 해요." },
  { id: 19, name: "태양", symbol: "☀", bg: "#2a1500", accent: "#fde68a", meaning: "기쁨과 활력, 사랑의 따스함", advice: "긍정적인 에너지를 발산하세요. 오늘 당신의 밝음이 주변을 환하게 해요." },
  { id: 20, name: "심판", symbol: "🔔", bg: "#0a1a2a", accent: "#7dd3fc", meaning: "각성과 새로운 부름", advice: "과거를 용서하고 새로 시작할 준비가 됐어요. 두려워 말고 나아가요." },
  { id: 21, name: "세계", symbol: "🌍", bg: "#002a1a", accent: "#34d399", meaning: "완성과 충만함, 원하는 것의 실현", advice: "지금 이 순간을 온전히 즐겨요. 원하는 사랑이 완성을 향해 가고 있어요." },
] as const;

const TC_STYLES = ".tc-scene{perspective:1000px;width:170px;margin:0 auto}.tc-card{width:170px;height:296px;position:relative;transform-style:preserve-3d;transition:transform 0.85s cubic-bezier(0.4,0.2,0.2,1)}.tc-card.flipped{transform:rotateY(180deg)}.tc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:0.875rem;border:1px solid rgba(255,255,255,0.1);overflow:hidden}.tc-back-face{transform:rotateY(180deg)}";

function makePrng(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function pickTarot(score: number, luckyNumber: number | null) {
  const seed = score * 997 + (luckyNumber ?? 0) * 31 + 555;
  const rand = makePrng(seed);
  return TAROT[Math.floor(rand() * TAROT.length)]!;
}

export function LoveCard({ fortune, subscribed }: LoveCardProps) {
  const [revealed, setRevealed] = useState(false);
  const tarot = pickTarot(fortune.score, fortune.luckyNumber);
  const cardBg = "linear-gradient(160deg, " + tarot.bg + " 0%, #08080f 55%, " + tarot.bg + " 100%)";

  return (
    <Card className="app-surface relative overflow-hidden">
      <style>{TC_STYLES}</style>

      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider text-accent">프리미엄</span>
        </div>
        <h2 className="font-mystic text-xl font-semibold leading-snug tracking-tight">
          오늘의 타로 카드
        </h2>
        <p className="text-sm text-muted-foreground">
          사랑운이 당신에게 등장시킨 카드와 오늘의 조언을 확인해봐요.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {subscribed ? (
          <>
            <div className="tc-scene">
              <div className={revealed ? "tc-card flipped" : "tc-card"}>
                {/* Front: face-down */}
                <div
                  className="tc-face flex flex-col items-center justify-center gap-4"
                  style={{ background: "linear-gradient(145deg, #130a2e 0%, #0a0a20 50%, #130a2e 100%)" }}
                >
                  <div className="grid grid-cols-4 gap-2 opacity-15" aria-hidden>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <span key={i} className="text-purple-300 text-sm text-center">✶</span>
                    ))}
                  </div>
                  <p className="font-mystic text-xs text-purple-300/40 tracking-widest px-4 text-center">
                    카드를 뽑아봐요
                  </p>
                </div>

                {/* Back: tarot card face */}
                <div
                  className="tc-face tc-back-face flex flex-col items-center justify-between py-6 px-4"
                  style={{ background: cardBg }}
                >
                  <p
                    className="font-mystic text-[11px] tracking-[0.3em] opacity-55"
                    style={{ color: tarot.accent }}
                  >
                    {ROMAN[tarot.id]}
                  </p>
                  <div className="text-6xl drop-shadow-lg select-none" role="img" aria-label={tarot.name}>
                    {tarot.symbol}
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-px w-10 mx-auto opacity-35" style={{ background: tarot.accent }} />
                    <p
                      className="font-mystic text-[13px] font-medium tracking-wide"
                      style={{ color: tarot.accent }}
                    >
                      {tarot.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!revealed ? (
              <div className="flex justify-center">
                <Button onClick={() => setRevealed(true)} size="lg" className="gap-2 font-mystic">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  카드 뽑기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/30 bg-muted/30 p-4 space-y-3 text-center">
                  <p className="font-mystic text-sm font-semibold leading-snug">{tarot.meaning}</p>
                  <div className="border-t border-border/30" />
                  <p className="text-sm text-foreground/75 leading-relaxed">{tarot.advice}</p>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    사랑운 {fortune.score}점 기반 · 오늘 하루 고정된 카드예요
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setRevealed(false)} className="text-xs">
                    다시 보기
                  </Button>
                </div>
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
                구독하면 오늘의 타로 카드와 연애 조언을 매일 받을 수 있어요.
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
