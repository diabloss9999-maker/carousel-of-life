"use client";

/**
 * 오늘의 캐릭터 배너.
 * 캐릭터가 홈 화면에 실제로 존재하는 느낌 — 대형 atmospheric 배너.
 */
import { CharacterImage } from "@/components/shared/character-image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CHARACTERS } from "@/lib/chat/characters";
import type { CharacterId, CharacterCategory } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface DailyQuestionCardProps {
  characterId: CharacterId;
  question: string;
}

/** 캐릭터별 테마 */
const CHAR_THEME: Record<CharacterId, {
  gradient: string;
  glow: string;
  accent: string;
  border: string;
  badge: string;
  badgeText: string;
}> = {
  child:      { gradient: "from-red-950/60 via-black/40 to-transparent",       glow: "shadow-red-900/30",      accent: "text-red-300",     border: "border-red-800/30",     badge: "bg-red-950/60 border-red-700/40",       badgeText: "text-red-300" },
  witch:      { gradient: "from-blue-950/60 via-black/40 to-transparent",      glow: "shadow-blue-900/30",     accent: "text-blue-300",    border: "border-blue-800/30",    badge: "bg-blue-950/60 border-blue-700/40",     badgeText: "text-blue-300" },
  sage:       { gradient: "from-amber-950/50 via-black/40 to-transparent",     glow: "shadow-amber-900/30",    accent: "text-amber-300",   border: "border-amber-700/30",   badge: "bg-amber-950/60 border-amber-600/40",   badgeText: "text-amber-300" },
  shaman:     { gradient: "from-rose-950/60 via-black/40 to-transparent",      glow: "shadow-rose-900/30",     accent: "text-rose-300",    border: "border-rose-700/30",    badge: "bg-rose-950/60 border-rose-700/40",     badgeText: "text-rose-300" },
  taoist:     { gradient: "from-cyan-950/60 via-black/40 to-transparent",      glow: "shadow-cyan-900/30",     accent: "text-cyan-300",    border: "border-cyan-800/30",    badge: "bg-cyan-950/60 border-cyan-700/40",     badgeText: "text-cyan-300" },
  dokkaebi:   { gradient: "from-purple-950/60 via-black/40 to-transparent",    glow: "shadow-purple-900/30",   accent: "text-purple-300",  border: "border-purple-800/30",  badge: "bg-purple-950/60 border-purple-700/40", badgeText: "text-purple-300" },
  hunter:     { gradient: "from-stone-950/60 via-black/40 to-transparent",     glow: "shadow-stone-900/30",    accent: "text-stone-300",   border: "border-stone-700/30",   badge: "bg-stone-950/60 border-stone-700/40",   badgeText: "text-stone-300" },
  runeshaman: { gradient: "from-indigo-950/60 via-black/40 to-transparent",    glow: "shadow-indigo-900/30",   accent: "text-indigo-300",  border: "border-indigo-700/30",  badge: "bg-indigo-950/60 border-indigo-700/40", badgeText: "text-indigo-300" },
  god:        { gradient: "from-sky-950/60 via-black/40 to-transparent",       glow: "shadow-sky-900/30",      accent: "text-sky-300",     border: "border-sky-700/30",     badge: "bg-sky-950/60 border-sky-600/40",       badgeText: "text-sky-300" },
};

/** 카테고리 → 세계관 라벨(서브) */
const CATEGORY_SUB: Record<CharacterCategory, string> = {
  이세계: "ASTRA RIFT",
  동양: "月蝕鏡",
  북유럽: "MIDHALL",
};
/** 카테고리 → characterSelect.* i18n 키 */
const CATEGORY_TKEY: Record<CharacterCategory, "categoryOtherworld" | "categoryEastern" | "categoryNordic"> = {
  이세계: "categoryOtherworld",
  동양: "categoryEastern",
  북유럽: "categoryNordic",
};

export function DailyQuestionCard({ characterId, question }: DailyQuestionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);
  const t = useTranslations("dailyQuestion");
  const tChar = useTranslations("characters");
  const tCat = useTranslations("characterSelect");

  const character = CHARACTERS[characterId];
  const theme = CHAR_THEME[characterId];
  const worldSub = CATEGORY_SUB[character.category] ?? "";
  const worldLabel = tCat(CATEGORY_TKEY[character.category]);
  const name = tChar(`${characterId}.name`);
  const title = tChar(`${characterId}.title`);

  function handleAnswer() {
    if (isPending || clicked) return;
    setClicked(true);
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: characterId }),
      });
      const json = await res.json();
      if (json.ok) router.push(`/chat/${json.data.sessionId}`);
    });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-xl",
        theme.border,
        theme.glow,
        "shadow-lg",
      )}
      style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
    >
      {/* 배경 글로우 */}
      <div
        className={cn(
          "absolute inset-0 opacity-30",
          `bg-gradient-to-r ${theme.gradient}`,
        )}
      />
      {/* 세계관 아이콘 — 우상단 장식 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/moon-signal.svg"
        alt=""
        aria-hidden
        className="absolute right-4 top-4 h-8 w-8 opacity-30 pointer-events-none"
      />

      <div className="relative flex gap-0">
        {/* 캐릭터 이미지 — 좌측 세로 배치 */}
        <div className="relative w-28 sm:w-36 flex-shrink-0">
          <CharacterImage
            character={character}
            width={600}
            height={900}
            quality={90}
            className="h-full w-full object-cover object-top"
            style={{ minHeight: "180px", maxHeight: "240px" }}
            sizes="(max-width: 640px) 112px, 144px"
          />
          {/* 우측 페이드 */}
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-white/8" />
        </div>

        {/* 우측 내용 */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5 min-w-0">
          {/* 상단: 세계 + 이름 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                "rounded border px-2 py-0.5 text-xs font-bold tracking-widest uppercase",
                theme.badge, theme.badgeText,
              )}>
                {worldLabel} · {worldSub}
              </span>
            </div>
            <div>
              <p className={cn("font-mystic text-lg font-bold leading-none", theme.accent)}>
                {name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
            </div>
          </div>

          {/* 중간: 오늘의 질문 */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground/50">{t("eyebrow")}</p>
            <p className="font-mystic text-sm leading-relaxed text-foreground/90">
              {question}
            </p>
          </div>

          {/* 하단: CTA */}
          <Button
            type="button"
            size="sm"
            onClick={handleAnswer}
            disabled={isPending || clicked}
            className={cn(
              "self-start gap-1.5 text-xs font-semibold",
              "bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur",
            )}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <MessageCircle className="h-3 w-3" aria-hidden />
            )}
            {t("answerCta", { name })}
          </Button>
        </div>
      </div>
    </div>
  );
}
