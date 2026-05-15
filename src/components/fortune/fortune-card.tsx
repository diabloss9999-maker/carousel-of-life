"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CharacterImage } from "@/components/shared/character-image";
import { Loader2, MessageCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuckyInfo } from "@/components/fortune/lucky-info";
import { SaveImageButton } from "@/components/shared/save-image-button";
import { ShareButton } from "@/components/shared/share-button";
import type { DailyFortune } from "@/db/schema";
import { type FortuneCategoryId } from "@/lib/constants";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import {
  getTodayCharacter,
  getTodayCharacterByCategory,
} from "@/lib/daily-question/rotation";

interface FortuneCardProps {
  fortune: DailyFortune;
  crackLevel?: number;
}

/** 카테고리별 fortuneCard 번역 키 (i18n). */
const CATEGORY_TKEY: Record<FortuneCategoryId, string> = {
  general: "categoryGeneral",
  love: "categoryLove",
  money: "categoryWealth",
  career: "categoryCareer",
  health: "categoryHealth",
  study: "categoryStudy",
  zodiac: "categoryZodiac",
  chinese_zodiac: "categoryChineseZodiac",
};

/** 캐릭터별 테두리 색상 (9명) */
const CHARACTER_BORDER: Record<CharacterId, string> = {
  child:      "ring-red-800/30",
  witch:      "ring-blue-800/30",
  sage:       "ring-amber-700/30",
  shaman:     "ring-rose-800/30",
  taoist:     "ring-cyan-800/30",
  dokkaebi:   "ring-purple-800/30",
  hunter:     "ring-stone-700/30",
  runeshaman: "ring-indigo-700/30",
  god:        "ring-sky-700/30",
};

/**
 * 운세 카테고리에 따라 해설 주술사를 결정.
 * - zodiac (별자리)          → 북유럽
 * - chinese_zodiac (십이간지) → 동양
 * - 그 외                    → 9명 전체 풀
 */
function pickFortuneCharacter(category: string, date: string): CharacterId {
  if (category === "zodiac") return getTodayCharacterByCategory("북유럽", date);
  if (category === "chinese_zodiac") return getTodayCharacterByCategory("동양", date);
  return getTodayCharacter(date);
}

export function FortuneCard({ fortune, crackLevel = 0 }: FortuneCardProps) {
  const t = useTranslations("fortuneCard");
  const tChar = useTranslations("characters");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 운세 카테고리·날짜 기반으로 해설 주술사 결정 (생성 시점 로직과 동일)
  const charId = pickFortuneCharacter(fortune.category, fortune.fortuneDate);
  const character = CHARACTERS[charId];
  const borderColor = CHARACTER_BORDER[charId] ?? "ring-border/40";
  const name = tChar(`${charId}.name`);
  const title = tChar(`${charId}.title`);

  const categoryKey = CATEGORY_TKEY[fortune.category as FortuneCategoryId];
  const label = categoryKey
    ? t(categoryKey as "categoryGeneral" | "categoryLove" | "categoryWealth" | "categoryCareer" | "categoryHealth" | "categoryStudy" | "categoryZodiac" | "categoryChineseZodiac")
    : t("categoryFallback");

  function handleChat() {
    if (isPending) return;
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: charId }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/chat/${json.data.sessionId}`);
      }
    });
  }

  function buildShareImageUrl(): string {
    const params = new URLSearchParams({
      title:     fortune.title,
      score:     String(fortune.score ?? 70),
      category:  label,
      content:   fortune.content.slice(0, 80),
      ...(fortune.luckyColor     && { color:     fortune.luckyColor }),
      ...(fortune.luckyNumber    && { number:    String(fortune.luckyNumber) }),
      ...(fortune.luckyDirection && { direction: fortune.luckyDirection }),
      date:      new Date(fortune.createdAt).toLocaleDateString(
        locale === "en" ? "en-US" : "ko-KR",
      ),
      char:      name,
      charTitle: title,
      crack:     String(crackLevel),
      locale,
    });
    return `/api/share/fortune?${params}`;
  }

  return (
    <Card className={`app-surface ring-1 ${borderColor}`}>
      <CardHeader className="space-y-3 pb-3">
        {/* 캐릭터 헤더 */}
        <div className="flex items-center gap-3">
          <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
            <CharacterImage
              character={character}
              fill
              className="object-cover object-top"
              sizes="64px"
              quality={90}
            />
          </div>
          <div>
            <p className="font-mystic text-[15px] font-semibold text-foreground/90">
              {name}
            </p>
            <p className="text-[15px] text-muted-foreground">{title}</p>
          </div>
          <span className="ml-auto text-[15px] text-muted-foreground">{label}</span>
        </div>

        <h2 className="font-mystic text-xl font-semibold leading-snug tracking-tight">
          {fortune.title}
        </h2>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
          {fortune.content}
        </p>

        <LuckyInfo
          color={fortune.luckyColor ?? null}
          number={fortune.luckyNumber ?? null}
          direction={fortune.luckyDirection ?? null}
        />

        {/* 채팅으로 연결 */}
        <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t("askMore", { name })}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={handleChat}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            )}
            {t("chatCta")}
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <SaveImageButton
            imageUrl={buildShareImageUrl()}
            filename={t("shareFilename", { label })}
          />
          <ShareButton
            title={`[${label}] ${fortune.title}`}
            text={t("shareTextLine", {
              label,
              title: fortune.title,
              content: fortune.content,
              color: fortune.luckyColor ?? "—",
              number: fortune.luckyNumber ?? "—",
              direction: fortune.luckyDirection ?? "—",
            })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
