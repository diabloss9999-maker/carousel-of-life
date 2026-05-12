"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MessageBubble, type DrawnCardMeta } from "@/components/chat/message-bubble";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CharacterId } from "@/lib/chat/characters";

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
  characterId?: CharacterId;
  onDeleteRequest?: () => void;
}

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  cards?: DrawnCardMeta[];
}

/** 캐릭터별 채팅창 색상 테마. */
const CHARACTER_THEME: Record<
  CharacterId,
  { surface: string; ring: string; input: string; send: string }
> = {
  child:     { surface: "bg-red-950/25 border border-red-800/30",     ring: "ring-red-700/40",     input: "border-red-800/30 bg-red-950/20 focus-visible:ring-red-700/40",         send: "bg-red-700 hover:bg-red-600 text-white" },
  witch:     { surface: "bg-blue-950/25 border border-blue-800/30",   ring: "ring-blue-700/40",    input: "border-blue-800/30 bg-blue-950/20 focus-visible:ring-blue-700/40",       send: "bg-blue-700 hover:bg-blue-600 text-white" },
  sage:      { surface: "bg-amber-950/20 border border-amber-700/30", ring: "ring-amber-600/40",   input: "border-amber-700/30 bg-amber-950/15 focus-visible:ring-amber-600/40",   send: "bg-amber-600 hover:bg-amber-500 text-white" },
  shaman:    { surface: "bg-rose-950/20 border border-rose-700/30",   ring: "ring-rose-600/40",    input: "border-rose-700/30 bg-rose-950/15 focus-visible:ring-rose-600/40",       send: "bg-rose-700 hover:bg-rose-600 text-white" },
  taoist:    { surface: "bg-cyan-950/20 border border-cyan-800/30",   ring: "ring-cyan-700/40",    input: "border-cyan-800/30 bg-cyan-950/15 focus-visible:ring-cyan-700/40",       send: "bg-cyan-700 hover:bg-cyan-600 text-white" },
  dokkaebi:  { surface: "bg-purple-950/25 border border-purple-800/30", ring: "ring-purple-700/40", input: "border-purple-800/30 bg-purple-950/20 focus-visible:ring-purple-700/40", send: "bg-purple-700 hover:bg-purple-600 text-white" },
};

const DEFAULT_THEME = CHARACTER_THEME.witch;

export function ChatWindow({
  sessionId,
  initialMessages,
  characterId,
  onDeleteRequest,
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const theme = characterId ? (CHARACTER_THEME[characterId] ?? DEFAULT_THEME) : DEFAULT_THEME;

  /** textarea 높이 자동 조절 */
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  /** Enter = 전송 / Shift+Enter = 줄바꿈 */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        const form = e.currentTarget.closest("form");
        form?.requestSubmit();
      }
    }
  }

  // 새 메시지 또는 청크가 들어올 때 스크롤 맨 아래로.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // 스트리밍 완료 시 입력창 자동 포커스
  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

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
    // 높이 리셋 + 재포커스
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

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
        return;
      }

      if (!res.body) {
        setError("응답 본문이 비어있어요.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let cardsExtracted = false;
      let drawnCards: DrawnCardMeta[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        // 첫 줄 "CARDS:{json}\n" 파싱
        if (!cardsExtracted && acc.startsWith("CARDS:")) {
          const newlineIdx = acc.indexOf("\n");
          if (newlineIdx !== -1) {
            try {
              const jsonStr = acc.slice("CARDS:".length, newlineIdx);
              drawnCards = JSON.parse(jsonStr) as DrawnCardMeta[];
            } catch { /* ignore */ }
            acc = acc.slice(newlineIdx + 1);
            cardsExtracted = true;
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: acc, cards: drawnCards }
              : m,
          ),
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m,
        ),
      );

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
    if (onDeleteRequest) {
      onDeleteRequest();
      return;
    }
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
    <div className="flex h-full flex-col gap-3">
      {/* 삭제 버튼 */}
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

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 space-y-4 overflow-y-auto rounded-xl p-4 backdrop-blur-sm",
          theme.surface,
        )}
      >
        {messages.length === 0 ? (
          <EmptyState characterId={characterId} />
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              isStreaming={m.isStreaming}
              cards={m.cards}
            />
          ))
        )}
      </div>

      {error ? (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm",
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

      {/* 입력창 */}
      <form onSubmit={handleSend} className="flex flex-col gap-1.5">
        <div
          className={cn(
            "flex gap-2 rounded-xl border p-1.5 shadow-sm backdrop-blur",
            theme.input,
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 걸 물어봐 (Enter 전송 · Shift+Enter 줄바꿈)"
            disabled={isStreaming}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            autoFocus
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 py-2 px-1 leading-relaxed"
            style={{ minHeight: "36px", maxHeight: "120px" }}
          />
          <Button
            type="submit"
            disabled={isStreaming || isPending || input.trim().length === 0}
            size="lg"
            className={theme.send}
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

// =============================================================================
// 빈 화면 — 캐릭터별 세계관 첫 인사
// =============================================================================

const EMPTY_LINES: Record<string, { line1: string; line2: string }> = {
  child:    { line1: "입을 열어.",              line2: "욕망이든 상처든, 어차피 다 보이거든." },
  witch:    { line1: "달이 당신을 부르고 있어.", line2: "기억의 안개 속에서, 무엇이 보여?" },
  sage:     { line1: "여기 있어요.",             line2: "어떤 이야기든 들을게요. 괜찮아요." },
  shaman:   { line1: "신령이 말하기를…",         line2: "당신의 이름이 방울 소리에 섞여 들려." },
  taoist:   { line1: "천기를 읽는 중.",          line2: "당신 앞에 어떤 갈림길이 있는지 보여." },
  dokkaebi: { line1: "왜 왔어.",                 line2: "뭔가 원하는 게 있으니까 왔겠지." },
};

function EmptyState({ characterId }: { characterId?: string }) {
  const key = characterId ?? "witch";
  const lines = EMPTY_LINES[key] ?? EMPTY_LINES.witch;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center px-4">
      <p className="font-mystic text-base font-semibold text-foreground/70">
        {lines.line1}
      </p>
      <p className="text-xs text-muted-foreground/50 leading-relaxed">
        {lines.line2}
      </p>
    </div>
  );
}
