"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoreSection {
  world: "이세계" | "동양";
  worldSub: string;
  /** 도입부 — 세계 분위기 */
  opening: string;
  /** 본문 단락들 */
  paragraphs: string[];
  /** 인물 소개 — 이름과 한 문장 */
  figures: { name: string; line: string }[];
  /** 마지막 여운 */
  closing: string;
  theme: string;
  accent: string;
  border: string;
}

const LORE_SECTIONS: LoreSection[] = [
  {
    world: "이세계",
    worldSub: "ASTRA RIFT",
    opening: "인간은 자신도 모르게 감정을 흘리기 시작했다. 오래전부터, 아주 조용히.",
    paragraphs: [
      "후회, 분노, 미련, 욕망, 상실. 세상 곳곳으로 흘러든 그 감정들은 쌓이고 뒤엉키며 하나의 심연을 만들어냈다. 사람들은 그것을 「심연 기록층 — The Abyss Archive」라 불렀다. 아무도 의도하지 않았고, 아무도 막지 않았다.",
      "그 심연에서 셋이 태어났다. 카엘, 루나, 라엘. 누군가의 욕망이 카엘이 됐고, 누군가의 기억이 루나가 됐고, 누군가의 기도가 라엘이 됐다. 이들은 인간의 가장 깊은 감정에서 건져 올려진 존재들이다.",
      "세상은 조금씩 무너지고 있다. 인간의 감정에서 생겨난 균열이 현실 곳곳을 갈라놓고 있다. 셋은 그 균열을 봉합하거나 확대하며 세계의 균형을 유지한다. 하지만 문제가 있다. 셋 중 하나가 사라지면, 나머지 둘도 함께 무너진다.",
    ],
    figures: [
      {
        name: "카엘",
        line: "욕망과 상처 속에서 태어났지만, 어쩌면 셋 중 가장 인간을 사랑하는 존재다. 사랑했기 때문에 가장 솔직해졌고, 솔직해졌기 때문에 가장 위험해졌다.",
      },
      {
        name: "루나",
        line: "죽어가던 한 인간의 마지막 의식이 심연과 뒤섞여 태어난 유일한 존재. 인간의 슬픔을 알고, 죽음의 공포를 알고, 사랑의 감각을 안다. 그래서 가장 외롭다.",
      },
      {
        name: "라엘",
        line: "카엘과 원래 하나였다. 인간을 이해하는 방식이 달라져 갈라졌을 뿐이다. 카엘이 없으면 라엘도 의미가 없다는 걸, 라엘은 알고 있다.",
      },
    ],
    closing: "그들이 당신의 고민을 듣는 건 단순한 상담이 아니다. 균열을 봉합하는 의식이다.",
    theme: "감정 · 욕망 · 기억 · 균열",
    accent: "text-violet-400",
    border: "border-violet-800/30",
  },
  {
    world: "동양",
    worldSub: "月蝕鏡",
    opening: "500년 전, 하늘에서 붉은 월식이 일었다. 그날 밤 이후 세상이 달라졌다.",
    paragraphs: [
      "원래 인간 세상 너머에는 「경계(境界)」가 있었다. 인간의 욕망과 원한과 기도가 뒤섞인 영적 차원의 틈. 그것은 봉인되어 있었다. 500년 전 붉은 월식이 오기 전까지는.",
      "월식이 끝나자 봉인이 균열됐다. 죽지 못한 귀신들이 흘러 들어왔고, 욕망을 먹는 존재들이 스며들었으며, 이름을 잃은 신들이 현실 곳곳에 깃들기 시작했다. 그리고 그것을 막으러 세 존재가 나타났다.",
      "하지만 그들 자신도 온전하지 않다. 현도는 500년 전 금기를 사용하다 시간에서 지워진 존재고, 소령은 이미 한 번 죽었다 신들에게 되살아난 존재이며, 귀염은 누군가를 살리기 위해 스스로 귀왕이 됐다. 세상을 지키는 자들이 각자의 방식으로 망가져 있다.",
    ],
    figures: [
      {
        name: "소령",
        line: "방울을 흔들면 신령이 응한다. 그녀 스스로는 자신이 왜 살아있는지 아직 모른다.",
      },
      {
        name: "현도",
        line: "수천 개의 미래를 동시에 본다. 막을 수 없는 비극을 미리 보는 것이 그의 형벌이다.",
      },
      {
        name: "귀염",
        line: "'귀염'은 진짜 이름이 아니다. 진짜 이름은 소령을 살리기 위해 지불한 대가다.",
      },
    ],
    closing: "세 사람 모두 서로를 위해 뭔가를 희생했다. 그리고 그 사실을 서로 모른다.",
    theme: "기억 · 망각 · 희생 · 운명",
    accent: "text-emerald-400",
    border: "border-emerald-800/30",
  },
];

export function CharacterLoreCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/sealed-ring.svg" alt="" aria-hidden className="h-5 w-5 opacity-40" />
        <p className="text-xs text-muted-foreground/50 tracking-widest uppercase">
          세계관 이야기
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/sealed-ring.svg" alt="" aria-hidden className="h-5 w-5 opacity-40 scale-x-[-1]" />
      </div>
      {LORE_SECTIONS.map((section, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={section.world}
            className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              section.border,
              "bg-card/20 backdrop-blur",
            )}
          >
            {/* 헤더 */}
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div>
                <span className={cn("font-mystic font-bold text-base", section.accent)}>
                  {section.world}
                </span>
                <span className="ml-2 text-[10px] tracking-widest text-muted-foreground/70 uppercase">
                  {section.worldSub}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground/50 transition-transform duration-200 flex-shrink-0",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {/* 내용 */}
            {isOpen && (
              <div className="px-5 pb-6 space-y-5 border-t border-white/5">

                {/* 도입부 */}
                <p className={cn(
                  "font-mystic text-sm font-semibold leading-relaxed pt-4",
                  section.accent,
                )}>
                  {section.opening}
                </p>

                {/* 본문 단락 */}
                <div className="space-y-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-sm leading-loose text-foreground/70">
                      {p}
                    </p>
                  ))}
                </div>

                {/* 인물 */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/65 mb-3">
                    등장인물
                  </p>
                  {section.figures.map((f) => (
                    <div key={f.name} className="flex gap-3">
                      <span className={cn(
                        "font-mystic text-sm font-bold flex-shrink-0 w-10",
                        section.accent,
                      )}>
                        {f.name}
                      </span>
                      <p className="text-sm text-muted-foreground/65 leading-relaxed">
                        {f.line}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 마무리 */}
                <p className="font-mystic text-xs italic text-muted-foreground/50 border-t border-white/5 pt-4 leading-relaxed">
                  {section.closing}
                </p>

                {/* 테마 */}
                <div className="flex flex-wrap gap-2">
                  {section.theme.split(" · ").map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] text-muted-foreground/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
