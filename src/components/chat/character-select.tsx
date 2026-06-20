"use client";

import { CharacterImage } from "@/components/shared/character-image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { AffinityBar } from "@/components/affinity/affinity-bar";
import { calcLevel } from "@/lib/affinity/levels";
import {
  CHARACTERS,
  CHARACTERS_BY_CATEGORY,
  type CharacterId,
  type CharacterCategory,
} from "@/lib/chat/characters";
import { SPECIALTY_KEY } from "@/i18n/character-display";
import { cn } from "@/lib/utils";

interface CharacterSelectProps {
  affinities?: Record<string, number>;
  /** 유저 MBTI 기준 멤버별 궁합 점수 (없으면 궁합 배지 미표시). */
  matchScores?: Record<string, number> | null;
}

const CATEGORY_ORDER: CharacterCategory[] = ["기본", "확장", "보관"];

/** 카테고리별 디자인 — 라벨은 i18n 에서, 색상은 여기서. */
const CATEGORY_DECO: Record<CharacterCategory, {
  labelKey: "Primary" | "Extended" | "Archive";
  border: string;
  text: string;
  dot: string;
  panel: string;
  method: string;
}> = {
  기본: {
    labelKey: "Primary",
    border: "border-violet-500/30",
    text: "text-violet-400",
    dot: "bg-violet-500",
    panel: "bg-violet-500/5",
    method: "border-violet-400/40 bg-violet-500/10 text-violet-200",
  },
  확장: {
    labelKey: "Extended",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    panel: "bg-emerald-500/5",
    method: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  },
  보관: {
    labelKey: "Archive",
    border: "border-sky-500/30",
    text: "text-sky-300",
    dot: "bg-sky-400",
    panel: "bg-sky-500/5",
    method: "border-sky-400/40 bg-sky-500/10 text-sky-100",
  },
};

/** 멤버별 호버 강조 색 — 링 + 멤버 컬러 글로우 */
const CHAR_ACCENT: Record<CharacterId, string> = {
  child:      "hover:ring-red-700/50 hover:border-red-800/50 hover:shadow-[0_18px_40px_-16px_rgba(185,28,28,0.45)]",
  witch:      "hover:ring-blue-700/50 hover:border-blue-800/50 hover:shadow-[0_18px_40px_-16px_rgba(29,78,216,0.45)]",
  sage:       "hover:ring-amber-600/50 hover:border-amber-700/50 hover:shadow-[0_18px_40px_-16px_rgba(217,119,6,0.45)]",
  shaman:     "hover:ring-rose-700/50 hover:border-rose-800/50 hover:shadow-[0_18px_40px_-16px_rgba(190,18,60,0.45)]",
  taoist:     "hover:ring-cyan-700/50 hover:border-cyan-800/50 hover:shadow-[0_18px_40px_-16px_rgba(14,116,144,0.45)]",
  dokkaebi:   "hover:ring-purple-700/50 hover:border-purple-800/50 hover:shadow-[0_18px_40px_-16px_rgba(126,34,206,0.45)]",
  hunter:     "hover:ring-stone-600/50 hover:border-stone-700/50 hover:shadow-[0_18px_40px_-16px_rgba(87,83,78,0.5)]",
  runeshaman: "hover:ring-indigo-600/50 hover:border-indigo-700/50 hover:shadow-[0_18px_40px_-16px_rgba(79,70,229,0.45)]",
  god:        "hover:ring-sky-500/50 hover:border-sky-600/50 hover:shadow-[0_18px_40px_-16px_rgba(2,132,199,0.45)]",
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

interface CreateSessionResponse {
  ok: boolean;
  data?: { sessionId: string };
  error?: {
    code?: string;
  };
}

export function CharacterSelect({
  affinities = {},
  matchScores = null,
}: CharacterSelectProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [hoveredCharacterId, setHoveredCharacterId] = useState<CharacterId | null>(null);
  const [isPending, startTransition] = useTransition();
  // 가장 궁합 높은 멤버를 "최고의 짝" 배지에 사용한다.
  const bestMatchId: CharacterId | null = matchScores
    ? ((Object.entries(matchScores) as [CharacterId, number][])
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
    : null;

  const tCat = useTranslations("characterSelect");
  const tChar = useTranslations("characters");
  const tSpec = useTranslations("specialties");

  async function handleSelect(id: CharacterId) {
    setSelected(id);
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: id }),
      });
      const json = (await res.json().catch(() => null)) as CreateSessionResponse | null;
      if (json?.ok && json.data) {
        router.push(`/chat/${json.data.sessionId}`);
      }
    });
  }

  return (
    <div className="space-y-8">
      <p className="text-center text-[15px] text-muted-foreground">
        {tCat("askToday")}
      </p>

      {CATEGORY_ORDER.map((category) => {
        const deco = CATEGORY_DECO[category];
        const ids = CHARACTERS_BY_CATEGORY[category];
        const label = tCat(`category${deco.labelKey}` as "categoryPrimary" | "categoryExtended" | "categoryArchive");
        const sub = tCat(`categorySub${deco.labelKey}` as "categorySubPrimary" | "categorySubExtended" | "categorySubArchive");
        const method = tCat(`categoryMethod${deco.labelKey}` as "categoryMethodPrimary" | "categoryMethodExtended" | "categoryMethodArchive");
        const flavor = tCat(`categoryFlavor${deco.labelKey}` as "categoryFlavorPrimary" | "categoryFlavorExtended" | "categoryFlavorArchive");

        return (
          <div key={category} className="space-y-4">
            {/* 카테고리 헤더 */}
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 sm:px-5 sm:py-4",
                "shadow-[0_12px_30px_-24px_rgba(0,0,0,0.95)] backdrop-blur-[1px]",
                deco.border,
                deco.panel,
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", deco.dot)} />
                <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                  <span className={cn("font-mystic text-[15px] font-bold tracking-wider", deco.text)}>
                    {label}
                  </span>
                  <span className="text-[15px] tracking-widest text-muted-foreground/50 uppercase">
                    {sub}
                  </span>
                </div>
                <span
                  className={cn(
                    "ml-auto rounded-full border px-2.5 py-1 text-[15px] font-semibold leading-none whitespace-nowrap",
                    deco.method,
                  )}
                >
                  {method}
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground/80 sm:mt-3">
                {flavor}
              </p>
              <div className={cn("mt-3 h-px", deco.border, "border-t")} />
            </div>

            {/* 멤버 카드 그리드. 이미지 슬롯은 기존 멤버 원본과 같은 2:3 카드 비율. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              {ids.map((id) => {
                const char = CHARACTERS[id];
                const isLoading = isPending && selected === id;
                const isSelected = selected === id;
                const name = tChar(`${id}.name`);
                const title = tChar(`${id}.title`);
                const hook = tChar(`${id}.hook`);
                // 친밀도 레벨로 스냅 해금 — Lv.0=1장, 레벨당 +1장 (최대 5장).
                const affinityLevel = calcLevel(id, affinities[id] ?? 0).level;
                const totalSlides = char.imageSlides?.length ?? 1;
                const baseSlideCount = Math.min(5, totalSlides);
                const bonusUnlockLevels = [10, 15, 20, 25, 30, 35];
                const unlockedBonusSlides = bonusUnlockLevels.filter(
                  (unlockLevel, index) =>
                    affinityLevel >= unlockLevel && totalSlides > baseSlideCount + index,
                ).length;
                const unlockedSlides = Math.min(
                  totalSlides,
                  Math.min(affinityLevel, baseSlideCount) + unlockedBonusSlides,
                );
                const nextSlideUnlockLevel =
                  unlockedSlides < baseSlideCount
                    ? unlockedSlides + 1
                    : bonusUnlockLevels[unlockedSlides - baseSlideCount] ?? 35;
                const specialty = tSpec(SPECIALTY_KEY[id] as "fortune" | "tarot" | "pillarsCelestial" | "runeOmen" | "runeOracle" | "runeVoice");

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    onMouseEnter={() => setHoveredCharacterId(id)}
                    onMouseLeave={() => setHoveredCharacterId(null)}
                    disabled={isPending}
                    aria-label={name}
                    className={cn(
                      "group relative flex flex-col items-center gap-3 sm:gap-2",
                      "rounded-2xl border ring-1 ring-transparent p-3 text-center transition-all duration-200",
                      "hover:-translate-y-1 motion-reduce:hover:translate-y-0",
                      "disabled:cursor-not-allowed",
                      isSelected
                        ? CHAR_SELECTED[id]
                        : cn("app-surface", CHAR_ACCENT[id]),
                    )}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl shadow-md sm:aspect-[2/3]">
                      <CharacterImage
                        character={char}
                        fill
                        quality={95}
                        slideshowActive={hoveredCharacterId === id}
                        maxSlides={unlockedSlides}
                        className="origin-top scale-[1.18] transition-transform duration-300 group-hover:scale-[1.22] sm:scale-100 sm:group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 25vw, 220px"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                          <Loader2 className="h-7 w-7 text-white animate-spin" />
                        </div>
                      )}
                      {/* 전문 배지 */}
                      <div className="absolute top-2 left-2 on-character-image">
                        <span className="rounded-md bg-black/65 px-2 py-0.5 text-[15px] font-medium leading-none">
                          {specialty}
                        </span>
                      </div>
                      {/* 궁합 배지 */}
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 on-character-image">
                        {matchScores && matchScores[id] != null && (
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[12px] font-semibold leading-none",
                              id === bestMatchId
                                ? "bg-amber-400/90 text-black"
                                : "bg-black/65 text-white/90",
                            )}
                          >
                            {id === bestMatchId ? "★ " : ""}
                            궁합 {matchScores[id]}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 이름 + 직함 — 모바일은 여기까지만 */}
                    <div className="w-full space-y-1">
                      <p className="font-mystic font-bold text-lg leading-tight text-foreground/95 sm:text-[15px]">
                        {name}
                      </p>
                      <p className="text-[15px] text-muted-foreground/80 leading-tight">
                        {title}
                      </p>
                      {/* 훅 — 데스크탑(sm+)에서만 */}
                      <p className="hidden sm:block text-[15px] text-foreground/80 leading-snug font-mystic italic">
                        &ldquo;{hook}&rdquo;
                      </p>
                      {/* 친밀도 — 데스크탑(sm+)에서만 */}
                      <div className="hidden sm:block">
                        <AffinityBar
                          characterId={id}
                          points={affinities[id] ?? 0}
                          compact
                        />
                        {unlockedSlides < totalSlides ? (
                          // AffinityBar 표기는 Lv.1부터 시작(floor(pt/10)+1) — 동일 기준으로 안내.
                          <p className="mt-1 text-[11px] text-muted-foreground/70">
                            📸 {unlockedSlides}/{totalSlides}장 — Lv.{nextSlideUnlockLevel} 달성 시 새 사진 해금
                          </p>
                        ) : totalSlides > 1 ? (
                          <p className="mt-1 text-[11px] text-muted-foreground/70">
                            📸 사진 {totalSlides}장 모두 해금!
                          </p>
                        ) : null}
                      </div>
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
