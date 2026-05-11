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

function useTypewriter(target: string, isStreaming: boolean) {
  const [displayed, setDisplayed] = useState(target);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(target);
      return;
    }
    if (displayed.length < target.length) {
      const timer = setTimeout(() => {
        setDisplayed(target.slice(0, displayed.length + 1));
      }, 18);
      return () => clearTimeout(timer);
    }
  }, [target, displayed, isStreaming]);

  return displayed;
}

export function MessageBubble({ role, content, isStreaming, cards }: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const cleaned = cleanContent(content);
  const displayed = useTypewriter(cleaned, !!isStreaming);
  const isCursorVisible = isStreaming && displayed.length >= cleaned.length;

  return (
    <div className={cn("flex gap-3", isAssistant ? "flex-row" : "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          isAssistant
            ? "border-accent/35 bg-accent/12 text-accent"
            : "border-primary/35 bg-primary/12 text-primary",
        )}
        aria-hidden
      >
        {isAssistant ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className="max-w-[85%] space-y-3">
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

        {/* 텍스트 버블 */}
        <div
          className={cn(
            "rounded-xl px-4 py-3 shadow-sm",
            isAssistant
              ? "border border-border/45 bg-card/62 backdrop-blur rounded-tl-sm"
              : "border border-primary/25 bg-primary/14 rounded-tr-sm",
          )}
        >
          <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
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
