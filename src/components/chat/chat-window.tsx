"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { MessageBubble, type DrawnCardMeta, type ShareInfo } from "@/components/chat/message-bubble";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { useFractureSystem } from "@/hooks/use-fracture-system";
import { getPlaceholder } from "@/lib/fracture/fracture-events";
import { recordEcho } from "@/lib/systems/long-term-memory";

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
  child:      { surface: "bg-red-950/25 border border-red-800/30",     ring: "ring-red-700/40",     input: "border-red-800/30 bg-red-950/20 focus-visible:ring-red-700/40",         send: "bg-red-700 hover:bg-red-600 text-white" },
  witch:      { surface: "bg-blue-950/25 border border-blue-800/30",   ring: "ring-blue-700/40",    input: "border-blue-800/30 bg-blue-950/20 focus-visible:ring-blue-700/40",       send: "bg-blue-700 hover:bg-blue-600 text-white" },
  sage:       { surface: "bg-amber-950/20 border border-amber-700/30", ring: "ring-amber-600/40",   input: "border-amber-700/30 bg-amber-950/15 focus-visible:ring-amber-600/40",   send: "bg-amber-600 hover:bg-amber-500 text-white" },
  shaman:     { surface: "bg-rose-950/20 border border-rose-700/30",   ring: "ring-rose-600/40",    input: "border-rose-700/30 bg-rose-950/15 focus-visible:ring-rose-600/40",     send: "bg-rose-700 hover:bg-rose-600 text-white" },
  taoist:     { surface: "bg-cyan-950/20 border border-cyan-800/30",   ring: "ring-cyan-700/40",    input: "border-cyan-800/30 bg-cyan-950/15 focus-visible:ring-cyan-700/40",     send: "bg-cyan-700 hover:bg-cyan-600 text-white" },
  dokkaebi:   { surface: "bg-purple-950/25 border border-purple-800/30", ring: "ring-purple-700/40", input: "border-purple-800/30 bg-purple-950/20 focus-visible:ring-purple-700/40", send: "bg-purple-700 hover:bg-purple-600 text-white" },
  hunter:     { surface: "bg-stone-950/30 border border-stone-700/30", ring: "ring-stone-600/40",   input: "border-stone-700/30 bg-stone-950/20 focus-visible:ring-stone-600/40",   send: "bg-stone-700 hover:bg-stone-600 text-white" },
  runeshaman: { surface: "bg-indigo-950/25 border border-indigo-700/30", ring: "ring-indigo-600/40", input: "border-indigo-700/30 bg-indigo-950/20 focus-visible:ring-indigo-600/40", send: "bg-indigo-700 hover:bg-indigo-600 text-white" },
  god:        { surface: "bg-sky-950/25 border border-sky-700/30",     ring: "ring-sky-500/40",     input: "border-sky-700/30 bg-sky-950/20 focus-visible:ring-sky-500/40",       send: "bg-sky-600 hover:bg-sky-500 text-white" },
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
  const t = useTranslations("chatShell");
  const tChars = useTranslations("characters");
  const rawLocale = useLocale();
  const shareLocale: "ko" | "en" = rawLocale === "en" ? "en" : "ko";

  const { state: fractureState, isNight } = useFractureSystem();
  const placeholder = getPlaceholder(fractureState, isNight);

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
      setError(t("messageTooLong", { n: MAX_MESSAGE_LENGTH }));
      return;
    }

    setError(null);
    setInput("");
    // 높이 리셋 + 재포커스
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    // 사용자 메시지를 장기 기억(echo)에 기록 — 감정 키워드 포함 시에만 저장됨
    recordEcho(trimmed);

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
        const isQuota = json?.error?.code === "quota_exceeded";
        // 한도 초과는 그대로, 그 외 오류는 캐릭터 변명으로 대체
        if (isQuota) {
          setError("quota");
        } else {
          const excuse = characterId ? (CHARACTERS[characterId]?.errorExcuse ?? t("excuseFallback")) : t("excuseFallback");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: excuse, isStreaming: false }
                : m,
            ),
          );
        }
        return;
      }

      if (!res.body) {
        const excuse = characterId ? (CHARACTERS[characterId]?.errorExcuse ?? t("excuseFallback")) : t("excuseFallback");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: excuse, isStreaming: false }
              : m,
          ),
        );
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
    } catch {
      const excuse = characterId ? (CHARACTERS[characterId]?.errorExcuse ?? t("excuseFallback")) : t("excuseFallback");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: excuse, isStreaming: false }
            : m,
        ),
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
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(ROUTES.chat);
    }
  }

  const isQuotaError = error === "quota";
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
          <Trash2 className="h-4 w-4" aria-hidden /> {t("deleteTitle")}
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
          messages.map((m, i) => {
            // 어시스턴트 메시지일 때 직전 user 질문을 share 데이터로 묶어준다.
            const prev = i > 0 ? messages[i - 1] : null;
            const share: ShareInfo | undefined =
              m.role === "assistant" && characterId && prev && prev.role === "user" && prev.content
                ? {
                    characterId,
                    characterName: tChars(`${characterId}.name`),
                    question: prev.content,
                    locale: shareLocale,
                  }
                : undefined;
            return (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                isStreaming={m.isStreaming}
                cards={m.cards}
                share={share}
              />
            );
          })
        )}
      </div>

      {isQuotaError ? (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-400/30 bg-amber-50/5 px-3 py-2 text-[15px] text-amber-300/90">
          <span>{t("quotaExceeded")}</span>
          <Button asChild size="sm" variant="outline">
            <Link href={ROUTES.pricing}>{t("upgradeChatCta")}</Link>
          </Button>
        </div>
      ) : null}

      {/* 입력창 — ritual 스타일 */}
      <form onSubmit={handleSend} className="flex flex-col gap-1.5">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "10px",
            padding: "10px",
            borderRadius: "26px",
            border: "1px solid rgba(116,86,64,0.16)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,250,240,0.78))",
            backdropFilter: "blur(24px)",
            boxShadow: "0 8px 32px rgba(102,80,62,0.10)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isStreaming}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            autoFocus
            className="ritual-chat-textarea resize-none outline-none leading-relaxed text-[15px] py-3 px-4 rounded-[20px]"
            style={{
              minHeight: "48px",
              maxHeight: "120px",
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.10)",
              color: "rgba(0,0,0,0.82)",
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || isPending || input.trim().length === 0}
            aria-label={t("sendAriaLabel")}
            style={{
              minWidth: "52px",
              height: "52px",
              borderRadius: "20px",
              border: "1px solid rgba(191,166,106,0.26)",
              background: "radial-gradient(circle at 50% 30%, rgba(191,166,106,0.20), transparent 36%), rgba(18,16,31,0.72)",
              color: "rgba(246,239,220,0.94)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: "18px",
              opacity: (isStreaming || input.trim().length === 0) ? 0.4 : 1,
            }}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : "✦"}
          </button>
        </div>
        <div className="flex items-center justify-end px-1">
          <span
            className={cn(
              "text-[15px] tabular-nums",
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

function EmptyState({ characterId }: { characterId?: string }) {
  const tEmpty = useTranslations("chatShell.emptyLines");
  const key = characterId ?? "witch";
  // raw() 로 객체를 통째로 가져온 뒤 line1/line2 추출. 알 수 없는 키는 witch 폴백.
  const fallback = tEmpty.raw("witch") as { line1: string; line2: string };
  let lines: { line1: string; line2: string };
  try {
    lines = tEmpty.raw(key) as { line1: string; line2: string };
    if (!lines?.line1) lines = fallback;
  } catch {
    lines = fallback;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center px-4">
      <p className="font-mystic text-base font-semibold text-foreground/70">
        {lines.line1}
      </p>
      <p className="text-[15px] text-muted-foreground/50 leading-relaxed">
        {lines.line2}
      </p>
    </div>
  );
}
