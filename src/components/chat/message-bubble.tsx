import { Sparkles, User } from "lucide-react";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  /** 스트리밍 중인 메시지 표시. */
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  isStreaming,
}: MessageBubbleProps) {
  const isAssistant = role === "assistant";

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
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-primary/40 bg-primary/15 text-primary",
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
          "max-w-[85%] rounded-2xl px-4 py-3",
          isAssistant
            ? "bg-card/60 backdrop-blur border border-border/40 rounded-tl-sm"
            : "bg-primary/15 border border-primary/30 rounded-tr-sm",
        )}
      >
        <p
          className={cn(
            "font-mystic whitespace-pre-line leading-relaxed text-foreground/90",
            isStreaming && "after:inline-block after:w-1 after:h-4 after:ml-0.5 after:bg-accent after:animate-pulse",
          )}
        >
          {content || (isStreaming ? "" : "...")}
        </p>
      </div>
    </div>
  );
}
