"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 한 메시지 최대 글자 수. 서버 zod schema 와 동기화 유지. */
const MAX_MESSAGE_LENGTH = 100;

export interface InitialMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  sessionId: string;
  initialMessages: InitialMessage[];
}

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatWindow({ sessionId, initialMessages }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지 또는 청크가 들어올 때 스크롤 맨 아래로.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`질문은 ${MAX_MESSAGE_LENGTH}자 이내로 짧게 부탁해.`);
      return;
    }

    setError(null);
    setInput("");

    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "", isStreaming: true },
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const message = json?.error?.message ?? "응답을 받지 못했어요.";
        setError(message);
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId && m.id !== userId),
        );
        if (res.status === 429) {
          // 한도 초과 — error 표시 그대로 두고 끝.
        }
        return;
      }

      if (!res.body) {
        setError("응답 본문이 비어있어요.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m,
        ),
      );

      // 메시지 저장 후 사용량 표시 갱신을 위해 페이지 데이터 refetch.
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setMessages((prev) =>
        prev.filter((m) => m.id !== assistantId && m.id !== userId),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 대화를 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(ROUTES.chat);
    }
  }

  const isQuotaError = error?.includes("한도");
  const charsLeft = MAX_MESSAGE_LENGTH - input.length;

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> 대화 삭제
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 rounded-lg border border-border/40 bg-card/20 p-4 backdrop-blur"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            <p className="font-mystic">
              궁금한 걸 물어봐.
              <br />
              사주를 보고 차근차근 답해줄게.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              isStreaming={m.isStreaming}
            />
          ))
        )}
      </div>

      {error ? (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-md border px-3 py-2 text-sm",
            "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          <span>{error}</span>
          {isQuotaError ? (
            <Button asChild size="sm" variant="outline">
              <Link href={ROUTES.pricing}>프리미엄 구독하기</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSend} className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="궁금한 걸 물어봐 (100자 이내)"
            disabled={isStreaming}
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isStreaming || isPending || input.trim().length === 0}
            size="lg"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-end px-1">
          <span
            className={cn(
              "text-xs tabular-nums",
              charsLeft <= 0
                ? "text-destructive font-medium"
                : charsLeft <= 10
                  ? "text-accent"
                  : "text-muted-foreground",
            )}
          >
            {input.length} / {MAX_MESSAGE_LENGTH}
          </span>
        </div>
      </form>
    </div>
  );
}
