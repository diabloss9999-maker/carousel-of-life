"use client";

/**
 * 오늘의 질문 카드.
 * 캐릭터 초상화 + 질문 + "답하기" 버튼으로 구성.
 * 클릭 시 해당 캐릭터와의 새 채팅 세션을 열어준다.
 */
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CHARACTERS } from "@/lib/chat/characters";
import type { CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface DailyQuestionCardProps {
  characterId: CharacterId;
  question: string;
}

/** 캐릭터별 테마 색상. */
const CHARACTER_THEME: Record<CharacterId, { border: string; bg: string; button: string }> = {
  child: {
    border: "border-red-800/30",
    bg:     "bg-red-950/15",
    button: "bg-red-700 hover:bg-red-600 text-white",
  },
  witch: {
    border: "border-blue-800/30",
    bg:     "bg-blue-950/15",
    button: "bg-blue-700 hover:bg-blue-600 text-white",
  },
  sage: {
    border: "border-amber-700/30",
    bg:     "bg-amber-950/10",
    button: "bg-amber-600 hover:bg-amber-500 text-white",
  },
};

export function DailyQuestionCard({ characterId, question }: DailyQuestionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  const character = CHARACTERS[characterId];
  const theme = CHARACTER_THEME[characterId];

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
      if (json.ok) {
        router.push(`/chat/${json.data.sessionId}`);
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-4 backdrop-blur-sm transition-all",
        theme.border,
        theme.bg,
      )}
    >
      {/* 캐릭터 초상화 */}
      <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
        <Image
          src={character.imageSrc}
          alt={character.name}
          fill
          className="object-cover object-top"
          sizes="44px"
        />
      </div>

      {/* 내용 */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground">
            {character.name} · {character.title}
          </p>
          <p className="font-mystic text-sm leading-relaxed text-foreground/90">
            {question}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAnswer}
          disabled={isPending || clicked}
          className={cn("self-start", theme.button)}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          )}
          답하기
        </Button>
      </div>
    </div>
  );
}
