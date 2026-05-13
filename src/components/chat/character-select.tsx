"use client";

import { CharacterImage } from "@/components/shared/character-image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { AffinityBar } from "@/components/affinity/affinity-bar";
import {
  CHARACTERS,
  CHARACTERS_BY_CATEGORY,
  type CharacterId,
  type CharacterCategory,
} from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface CharacterSelectProps {
  affinities?: Record<string, number>;
}

const CATEGORY_ORDER: CharacterCategory[] = ["이세계", "동양", "북유럽"];

/** 카테고리별 디자인 설정 */
const CATEGORY_STYLE: Record<CharacterCategory, {
  label: string;
  sub: string;
  border: string;
  text: string;
  dot: string;
}> = {
  이세계: {
    label: "이세계",
    sub: "ASTRA RIFT",
    border: "border-violet-500/30",
    text: "text-violet-400",
    dot: "bg-violet-500",
  },
  동양: {
    label: "동양",
    sub: "月蝕鏡",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  북유럽: {
    label: "북유럽",
    sub: "MIDHALL",
    border: "border-sky-500/30",
    text: "text-sky-300",
    dot: "bg-sky-400",
  },
};

/** 캐릭터별 호버 강조 색 */
const CHAR_ACCENT: Record<CharacterId, string> = {
  child:      "hover:ring-red-700/50 hover:border-red-800/50",
  witch:      "hover:ring-blue-700/50 hover:border-blue-800/50",
  sage:       "hover:ring-amber-600/50 hover:border-amber-700/50",
  shaman:     "hover:ring-rose-700/50 hover:border-rose-800/50",
  taoist:     "hover:ring-cyan-700/50 hover:border-cyan-800/50",
  dokkaebi:   "hover:ring-purple-700/50 hover:border-purple-800/50",
  hunter:     "hover:ring-stone-600/50 hover:border-stone-700/50",
  runeshaman: "hover:ring-indigo-600/50 hover:border-indigo-700/50",
  god:        "hover:ring-sky-500/50 hover:border-sky-600/50",
};

const CHAR_SELECTED: Record<CharacterId, string> = {
  child:      "ring-red-700/60 border-red-800/60 bg-red-950/20",
  witch:      "ring-blue-700/60 border-blue-800/60 bg-blue-950/20",
  sage:       "ring-amber-600/60 border-amber-700/60 bg-amber-950/15",
  shaman:     "ring-rose-700/60 border-rose-800/60 bg-rose-950/20",
  taoist:     "ring-cyan-700/60 border-cyan-800/60 bg-cyan-950/20",
  dokkaebi:   "ring-purple-700/60 border-purple-800/60 bg-purple-950/20",
  hunter:     "ring-stone-600/60 border-stone-700/60 bg-stone-950/20",
  runeshaman: "ring-indigo-600/60 border-indigo-700/60 bg-indigo-950/20",
  god:        "ring-sky-500/60 border-sky-600/60 bg-sky-950/20",
};

export function CharacterSelect({ affinities = {} }: CharacterSelectProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSelect(id: CharacterId) {
    setSelected(id);
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: id }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/chat/${json.data.sessionId}`);
      }
    });
  }

  return (
    <div className="space-y-8">
      <p className="text-center text-sm text-muted-foreground">
        오늘은 누구와 이야기할까?
      </p>

      {CATEGORY_ORDER.map((category) => {
        const style = CATEGORY_STYLE[category];
        const ids = CHARACTERS_BY_CATEGORY[category];

        return (
          <div key={category} className="space-y-4">
            {/* 카테고리 헤더 */}
            <div className="flex items-center gap-3">
              <div className={cn("h-2 w-2 rounded-full flex-shrink-0", style.dot)} />
              <div className="flex items-baseline gap-2">
                <span className={cn("font-mystic text-sm font-bold tracking-wider", style.text)}>
                  {style.label}
                </span>
                <span className="text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                  {style.sub}
                </span>
              </div>
              <div className={cn("flex-1 h-px", style.border, "border-t")} />
            </div>

            {/* 캐릭터 카드 그리드 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ids.map((id) => {
                const char = CHARACTERS[id];
                const isLoading = isPending && selected === id;
                const isSelected = selected === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    disabled={isPending}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-2xl border ring-1 ring-transparent p-2 sm:p-3 text-center transition-all duration-200",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      isSelected
                        ? CHAR_SELECTED[id]
                        : cn("border-border/30 bg-card/30 backdrop-blur", CHAR_ACCENT[id]),
                    )}
                  >
                    {/* 캐릭터 이미지 */}
                    <div className="relative w-full overflow-hidden rounded-xl shadow-md">
                      <CharacterImage
                        character={char}
                        width={600}
                        height={900}
                        quality={95}
                        className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                          <Loader2 className="h-7 w-7 text-white animate-spin" />
                        </div>
                      )}
                      {/* 전문 배지 */}
                      <div className="absolute top-1.5 left-1.5">
                        <span className="rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-medium text-white/70 leading-none">
                          {char.specialty}
                        </span>
                      </div>
                    </div>

                    {/* 이름 + 직함 */}
                    <div className="w-full space-y-1">
                      <p className="font-mystic font-bold text-sm leading-tight text-foreground/95">
                        {char.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 leading-tight">
                        {char.title}
                      </p>
                      {/* 훅 — 데스크탑에서만 */}
                      <p className="hidden sm:block text-[11px] text-foreground/80 leading-snug font-mystic italic">
                        &ldquo;{char.hook}&rdquo;
                      </p>
                      {/* 친밀도 */}
                      <AffinityBar
                        characterId={id}
                        points={affinities[id] ?? 0}
                        compact
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
