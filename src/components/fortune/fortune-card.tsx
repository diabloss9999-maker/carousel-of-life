"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
import { FORTUNE_CATEGORIES, type FortuneCategoryId } from "@/lib/constants";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

interface FortuneCardProps {
  fortune: DailyFortune;
  crackLevel?: number;
}

const CATEGORY_LABEL: Record<FortuneCategoryId, string> = Object.fromEntries(
  FORTUNE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<FortuneCategoryId, string>;

/** 캐릭터별 테두리 색상 */
const CHARACTER_BORDER: Record<string, string> = {
  child: "ring-red-800/30",
  witch: "ring-blue-800/30",
  sage:  "ring-amber-700/30",
};

export function FortuneCard({ fortune, crackLevel = 0 }: FortuneCardProps) {
  const label = CATEGORY_LABEL[fortune.category as FortuneCategoryId] ?? "운세";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 날짜 기반으로 오늘의 캐릭터 결정
  const charId = getTodayCharacter(fortune.fortuneDate) as "child" | "witch" | "sage";
  const character = CHARACTERS[charId];
  const borderColor = CHARACTER_BORDER[charId] ?? "ring-border/40";

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
      date:      new Date(fortune.createdAt).toLocaleDateString("ko-KR"),
      char:      character.name,
      charTitle: character.title,
      crack:     String(crackLevel),
    });
    return `/api/share/fortune?${params}`;
  }

  return (
    <Card className={`app-surface ring-1 ${borderColor}`}>
      <CardHeader className="space-y-3 pb-3">
        {/* 캐릭터 헤더 */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
            <CharacterImage
              character={character}
              fill
              className="object-cover object-top"
              sizes="32px"
            />
          </div>
          <div>
            <p className="font-mystic text-sm font-semibold text-foreground/90">
              {character.name}
            </p>
            <p className="text-[10px] text-muted-foreground">{character.title}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{label}</span>
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
          <p className="text-xs text-muted-foreground leading-relaxed">
            {character.name}에게 더 물어보고 싶어?
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
            대화하기
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <SaveImageButton
            imageUrl={buildShareImageUrl()}
            filename={`인생의회전목마_${label}`}
          />
          <ShareButton
            title={`[${label}] ${fortune.title}`}
            text={`[${label}] ${fortune.title}\n\n${fortune.content}\n\n행운: ${fortune.luckyColor ?? "—"} / ${fortune.luckyNumber ?? "—"} / ${fortune.luckyDirection ?? "—"}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
