"use client";

import { useEffect, useState } from "react";
import { Sparkles, User } from "lucide-react";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  /** 스트리밍 중인 메시지 표시. */
  isStreaming?: boolean;
}

/** 마크다운 기호 및 과도한 빈 줄 제거. */
function cleanContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")   // **볼드** → 텍스트만
    .replace(/\*(.*?)\*/g, "$1")         // *이탤릭* → 텍스트만
    .replace(/^#{1,6}\s+/gm, "")        // # 헤딩 제거
    .replace(/^---+$/gm, "")            // --- 구분선 제거
    .replace(/^>\s*/gm, "")             // > 인용 제거
    .replace(/\n{3,}/g, "\n")           // 3줄 이상 연속 빈줄 → 1줄
    .replace(/\n{2}/g, "\n")            // 빈 줄(이중 줄바꿈) → 1줄
    .trim();
}

/** 글자 하나씩 나오는 타자 효과 훅. */
function useTypewriter(target: string, isStreaming: boolean) {
  const [displayed, setDisplayed] = useState(target);

  useEffect(() => {
    // 스트리밍 완료 → 전체 즉시 표시
    if (!isStreaming) {
      setDisplayed(target);
      return;
    }
    // 타겟보다 짧으면 한 글자씩 추가
    if (displayed.length < target.length) {
      const timer = setTimeout(() => {
        setDisplayed(target.slice(0, displayed.length + 1));
      }, 18); // 글자당 18ms ≈ 55자/초
      return () => clearTimeout(timer);
    }
  }, [target, displayed, isStreaming]);

  return displayed;
}

export function MessageBubble({
  role,
  content,
  isStreaming,
}: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const cleaned = cleanContent(content);
  const displayed = useTypewriter(cleaned, !!isStreaming);
  const isCursorVisible = isStreaming && displayed.length >= cleaned.length;

  return (
    <div
      className={cn(
        "flex gap-3",
        isAssistant ? "flex-row" : "flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          isAssistant
            ? "border-accent/35 bg-accent/12 text-accent"
            : "border-primary/35 bg-primary/12 text-primary",
        )}
        aria-hidden
      >
        {isAssistant ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 shadow-sm",
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
  );
}
