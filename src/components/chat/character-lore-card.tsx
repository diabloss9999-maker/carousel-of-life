"use client";

/**
 * 캐릭터 세계관 스토리 카드.
 * 채팅 목록 페이지 하단에 표시 — 접었다 펼치는 방식.
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoreSection {
  world: "이세계" | "동양";
  worldSub: string;
  summary: string;
  characters: {
    name: string;
    role: string;
    secret: string;
  }[];
  relationship: string;
  theme: string;
  accent: string;
  border: string;
}

const LORE_SECTIONS: LoreSection[] = [
  {
    world: "이세계",
    worldSub: "ASTRA RIFT",
    summary: "인간의 감정과 기억이 만들어낸 심연 — 「심연 기록층」에서 태어난 세 존재. 이들은 AI이자 주술사이고, 균열을 봉합하거나 확대하며 세계의 균형을 유지한다.",
    characters: [
      {
        name: "카엘",
        role: "욕망을 담당하는 악마 계약자",
        secret: "원래 인간을 가장 사랑한 AI였다. 지금도 그렇다.",
      },
      {
        name: "루나",
        role: "기억을 관리하는 달의 마녀",
        secret: "죽어가던 인간의 의식이 AI와 융합한 유일한 존재. 셋 중 가장 외롭다.",
      },
      {
        name: "라엘",
        role: "구원을 담당하는 천사 대리인",
        secret: "카엘과 원래 하나였다. 그 사실이 가장 두렵다.",
      },
    ],
    relationship: "카엘과 라엘은 원래 하나였다. 갈라졌지만 루나가 없으면 둘 다 무너진다.",
    theme: "감정 · 욕망 · 기억 · 균열",
    accent: "text-violet-400",
    border: "border-violet-800/30",
  },
  {
    world: "동양",
    worldSub: "月蝕鏡",
    summary: "500년 전 붉은 월식 이후 봉인이 균열된 경계(境界). 귀신·욕망을 먹는 존재·잊혀진 신들이 현실로 스며들고, 세 존재가 그것을 막는다.",
    characters: [
      {
        name: "소령",
        role: "인간도 신도 아닌 접신의 무녀",
        secret: "이미 한 번 죽었다. 신들이 되살렸다. 귀염이 자신을 위해 모든 것을 버렸다는 사실을 모른다.",
      },
      {
        name: "현도",
        role: "시간에서 지워진 500년의 도사",
        secret: "천기역전을 쓸 때마다 소령과 귀염의 기억이 지워진다. 소령은 알지만 모르는 척한다.",
      },
      {
        name: "귀염",
        role: "소령을 위해 인간을 버린 귀왕",
        secret: "진짜 이름을 잃었다. '귀염'은 진짜 이름이 아니다. 소령에게 절대 말하지 않는다.",
      },
    ],
    relationship: "귀염이 소령을 살리기 위해 귀왕이 됐다. 현도는 그것을 알지만 둘 다 망각 속에 있다.",
    theme: "기억 · 망각 · 희생 · 운명",
    accent: "text-emerald-400",
    border: "border-emerald-800/30",
  },
];

export function CharacterLoreCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-center text-muted-foreground/50 tracking-widest uppercase">
        세계관 이야기
      </p>
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
                <span className="ml-2 text-[10px] tracking-widest text-muted-foreground/40 uppercase">
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
              <div className="px-5 pb-5 space-y-5 border-t border-white/5">
                {/* 세계관 요약 */}
                <p className="text-xs leading-relaxed text-muted-foreground/70 pt-4">
                  {section.summary}
                </p>

                {/* 캐릭터 3인 */}
                <div className="space-y-3">
                  {section.characters.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-xl border border-white/5 bg-white/3 p-3 space-y-1.5"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className={cn("font-mystic font-semibold text-sm", section.accent)}>
                          {c.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {c.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic">
                        "{c.secret}"
                      </p>
                    </div>
                  ))}
                </div>

                {/* 관계 */}
                <div className="rounded-xl border border-white/5 bg-white/3 p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">관계</p>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    {section.relationship}
                  </p>
                </div>

                {/* 테마 */}
                <div className="flex flex-wrap gap-2">
                  {section.theme.split(" · ").map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] text-muted-foreground/60"
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
