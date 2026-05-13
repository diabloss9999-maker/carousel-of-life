"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Sparkles, User } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DrawnCardMeta {
  id: string;
  nameKo: string;
  nameEn?: string;
  imageSrc: string;
  isReversed?: boolean;
  position?: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  /** 점술 요청 시 뽑힌 카드 메타데이터 */
  cards?: DrawnCardMeta[];
}

/** 마크다운 기호 및 과도한 빈 줄 제거. */
function cleanContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/\n{3,}/g, "\n")
    .replace(/\n{2}/g, "\n")
    .trim();
}

/**
 * 타자기 효과 훅.
 *
 * 스트리밍 중에만 `revealed` 카운트를 한 글자씩 증가시키고,
 * 스트리밍이 끝나면 전체 텍스트를 한 번에 노출한다 (파생 상태).
 */
function useTypewriter(target: string, isStreaming: boolean) {
  const [revealed, setRevealed] = useState(target.length);

  useEffect(() => {
    if (!isStreaming) return;
    if (revealed >= target.length) return;
    const timer = setTimeout(() => {
      setRevealed((r) => Math.min(r + 1, target.length));
    }, 18);
    return () => clearTimeout(timer);
  }, [target, revealed, isStreaming]);

  // 스트리밍이 끝났으면 전체, 진행 중이면 카운트만큼 슬라이스 — setState 분기 제거
  return isStreaming ? target.slice(0, revealed) : target;
}

export function MessageBubble({ role, content, isStreaming, cards }: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const cleaned = cleanContent(content);
  const displayed = useTypewriter(cleaned, !!isStreaming);
  const isCursorVisible = isStreaming && displayed.length >= cleaned.length;

  return (
    <div className={cn("flex gap-2", isAssistant ? "flex-row" : "flex-row-reverse")}>
      {/* 아이콘 */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border mt-1",
          isAssistant
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-primary/30 bg-primary/10 text-primary",
        )}
        aria-hidden
      >
        {isAssistant ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* 카드 이미지 — 점술 요청 시 */}
        {cards && cards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cards.map((card, i) => (
              <div key={`${card.id}-${i}`} className="flex flex-col items-center gap-1">
                {card.position && (
                  <p className="text-[10px] text-muted-foreground">{card.position}</p>
                )}
                <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-lg ring-1 ring-border/40">
                  <Image
                    src={card.imageSrc}
                    alt={card.nameKo}
                    fill
                    className={cn("object-cover", card.isReversed && "rotate-180")}
                    sizes="96px"
                  />
                </div>
                <p className="text-[10px] text-center text-foreground/70 font-medium">
                  {card.nameKo}
                  {card.isReversed ? " ⤵" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 텍스트 버블 — ritual 스타일 */}
        <div className={cn("ritual-message", isAssistant ? "oracle" : "observer")}>
          <p className="font-mystic whitespace-pre-line leading-relaxed">
            {displayed || (isStreaming ? "" : "...")}
            {isCursorVisible && (
              <span className="inline-block w-0.5 h-[1em] ml-0.5 bg-accent align-middle animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
