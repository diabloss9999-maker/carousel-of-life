"use client";

/**
 * 오늘의 대화 주제 카드.
 * 멤버 말투와 인물성은 실제 채팅 화면에서만 노출한다.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { CharacterId } from "@/lib/chat/characters";

interface DailyQuestionCardProps {
  characterId: CharacterId;
  question: string;
}

export function DailyQuestionCard({ characterId, question }: DailyQuestionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);
  const t = useTranslations("dailyQuestion");

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
    <div className="app-surface rounded-2xl border border-border/40 p-4 shadow-lg sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-[15px] uppercase tracking-widest text-muted-foreground/60">
            <MessageCircle className="h-4 w-4 text-accent" aria-hidden />
            {t("eyebrow")}
          </p>
          <p className="font-mystic text-base font-semibold leading-relaxed text-foreground/90">
            {question}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAnswer}
          disabled={isPending || clicked}
          className="self-start gap-1.5 text-[15px] font-semibold"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-3 w-3" aria-hidden />
          )}
          {t("answerCta")}
        </Button>
      </div>
    </div>
  );
}
