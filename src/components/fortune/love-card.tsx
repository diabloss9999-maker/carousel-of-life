"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES } from "@/lib/constants";

const ROMAN: string[] = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];

interface LoveCardProps {
  fortune: DailyFortune;
  subscribed: boolean;
}

interface TarotCard {
  id: number;
  name: string;
  meaning: string;
  advice: string;
}

const TAROT: TarotCard[] = [
  { id: 0, name: "바보", meaning: "새로운 시작과 순수한 설렘", advice: "두려움 없이 감정에 솔직해져요. 지금은 뛰어들 때예요." },
  { id: 1, name: "마법사", meaning: "의지와 자신감으로 상대를 끌어당기는 힘", advice: "원하는 걸 분명히 표현하세요. 당신의 매력은 지금 정점이에요." },
  { id: 2, name: "여사제", meaning: "직관과 내면의 지혜", advice: "머리보다 마음의 소리를 믿어요. 서두르지 않아도 돼요." },
  { id: 3, name: "황후", meaning: "풍요로운 감정과 따뜻한 사랑", advice: "스스로를 충분히 사랑하면 상대도 자연히 끌려와요." },
  { id: 4, name: "황제", meaning: "안정감과 신뢰 기반의 관계", advice: "책임감 있는 태도가 상대에게 믿음을 줘요." },
  { id: 5, name: "교황", meaning: "전통과 헌신, 진지한 만남", advice: "진심 어린 대화가 관계를 깊게 만들어요." },
  { id: 6, name: "연인", meaning: "운명적인 선택과 연결", advice: "마음이 이끄는 대로 선택하세요. 오늘은 그럴 용기가 필요해요." },
  { id: 7, name: "전차", meaning: "강한 의지와 승리하는 사랑", advice: "적극적으로 나서세요. 상대는 당신의 자신감에 반할 거예요." },
  { id: 8, name: "힘", meaning: "인내와 부드러운 강인함", advice: "강요하지 말고 부드럽게 다가가세요. 진짜 힘은 여유에서 나와요." },
  { id: 9, name: "은둔자", meaning: "내면의 성찰과 혼자만의 시간", advice: "지금은 자신을 돌아볼 시간이에요. 서두르지 않아도 좋은 인연이 와요." },
  { id: 10, name: "운명의 수레바퀴", meaning: "전환점과 새로운 기회", advice: "변화를 두려워하지 마세요. 운이 당신 편으로 돌아오고 있어요." },
  { id: 11, name: "정의", meaning: "균형과 공정한 관계", advice: "솔직하고 공평한 태도가 신뢰를 만들어요." },
  { id: 12, name: "매달린 사람", meaning: "기다림과 다른 시각", advice: "잠시 멈추고 상대의 입장에서 바라보세요." },
  { id: 13, name: "죽음", meaning: "끝과 새로운 시작의 변환", advice: "지나간 것을 보내주세요. 새로운 사랑이 시작될 준비를 해요." },
  { id: 14, name: "절제", meaning: "조화와 균형 잡힌 흐름", advice: "급하지 않게 천천히 가세요. 균형이 아름다운 사랑을 만들어요." },
  { id: 15, name: "악마", meaning: "집착과 욕망, 해방의 필요", advice: "두려움이나 집착에서 벗어나세요. 자유로울 때 진짜 사랑이 와요." },
  { id: 16, name: "탑", meaning: "갑작스러운 변화와 각성", advice: "예상치 못한 변화가 올 수 있어요. 솔직함으로 위기를 기회로 만들어요." },
  { id: 17, name: "별", meaning: "희망과 치유, 빛나는 가능성", advice: "희망을 잃지 마세요. 당신에게 밝은 사랑이 다가오고 있어요." },
  { id: 18, name: "달", meaning: "불확실함과 숨겨진 감정", advice: "감정을 솔직하게 표현하기 어렵더라도 조금씩 열어가세요." },
  { id: 19, name: "태양", meaning: "기쁨과 활력, 밝은 사랑", advice: "오늘은 사랑 운이 최고예요! 자신 있게 표현하면 좋은 결과가 있어요." },
  { id: 20, name: "심판", meaning: "부활과 새로운 각성", advice: "과거의 교훈을 받아들이고 새롭게 출발할 준비가 됐어요." },
  { id: 21, name: "세계", meaning: "완성과 충만함, 원하는 것의 실현", advice: "지금 이 순간을 온전히 즐겨요. 사랑이 완성에 가까워지고 있어요." },
];

const TC_STYLES = ".tc-scene{perspective:1100px;width:185px;margin:0 auto}.tc-card{width:185px;height:323px;position:relative;transform-style:preserve-3d;transition:transform 0.9s cubic-bezier(0.4,0.2,0.2,1)}.tc-card.flipped{transform:rotateY(180deg)}.tc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:0.75rem;overflow:hidden}.tc-back-face{transform:rotateY(180deg)}.tc-img{width:100%;height:100%;object-fit:cover;display:block}.tc-name-bar{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0) 100%);padding:1.5rem 0.75rem 0.6rem;text-align:center}";

function tarotImg(id: number): string {
  return "https://www.sacred-texts.com/tarot/pkt/img/ar" + String(id).padStart(2, "0") + ".jpg";
}

function makePrng(seed: number): () => number {
  let s = (seed | 0);
  return function (): number {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

function pickTarot(score: number, luckyNumber: number | null): TarotCard {
  const seed = score * 997 + (luckyNumber ?? 0) * 31 + 555;
  const rand = makePrng(seed);
  const idx = Math.floor(rand() * TAROT.length) % TAROT.length;
  return TAROT[idx] as TarotCard;
}

export function LoveCard({ fortune, subscribed }: LoveCardProps) {
  const [revealed, setRevealed] = useState(false);
  const score = Number(fortune.score);
  const luckyNum: number | null = fortune.luckyNumber != null ? Number(fortune.luckyNumber) : null;
  const tarot = pickTarot(score, luckyNum);

  return (
    <Card className="app-surface relative overflow-hidden">
      <style>{TC_STYLES}</style>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-amber-500 mb-1">
          <Crown className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">프리미엄</span>
        </div>
        <h2 className="text-lg font-bold">오늘의 타로 카드</h2>
        <p className="text-sm text-muted-foreground">
          사랑운이 당신에게 등장시킨 카드와 오늘의 조언을 확인해봐요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscribed ? (
          <>
            <div className="tc-scene">
              <div className={revealed ? "tc-card flipped" : "tc-card"}>
                <div className="tc-face" style={{ background: "linear-gradient(145deg,#130a2e 0%,#0a0a20 50%,#130a2e 100%)" }}>
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                    <div className="grid grid-cols-4 gap-2 opacity-15">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span key={i} className="text-purple-300 text-lg">✶</span>
                      ))}
                    </div>
                    <p className="text-white/60 text-sm text-center">카드를 뽑아봐요</p>
                  </div>
                </div>
                <div className="tc-face tc-back-face">
                  <Image
                    src={tarotImg(tarot.id)}
                    alt={tarot.name}
                    width={185}
                    height={323}
                    unoptimized
                    className="tc-img"
                  />
                  <div className="tc-name-bar">
                    <p className="text-white/70 text-xs">{ROMAN[tarot.id] ?? ""}</p>
                    <p className="text-white font-bold text-sm">{tarot.name}</p>
                  </div>
                </div>
              </div>
            </div>
            {!revealed ? (
              <Button onClick={() => setRevealed(true)} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                카드 뽑기
              </Button>
            ) : (
              <div className="space-y-3 text-center">
                <p className="font-semibold text-base">{tarot.meaning}</p>
                <p className="text-sm text-muted-foreground">{tarot.advice}</p>
                <p className="text-xs text-muted-foreground/60">
                  사랑운 {score}점 기반 · 오늘 하루 고정된 카드예요
                </p>
                <Button variant="outline" size="sm" onClick={() => setRevealed(false)}>
                  다시 보기
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div
                className="opacity-40 blur-sm"
                style={{ height: "323px", width: "185px", background: "linear-gradient(145deg,#130a2e 0%,#0a0a20 50%,#130a2e 100%)", borderRadius: "0.75rem" }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              프리미엄 구독 시 오늘의 타로 카드와 사랑 조언을 확인할 수 있어요.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBSCRIBE}>프리미엄 시작하기</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
