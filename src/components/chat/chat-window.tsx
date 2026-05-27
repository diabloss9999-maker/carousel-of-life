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
  /** 점술 요청 시 DB 에 저장된 카드 메타 — 페이지 리로드 후에도 이미지 유지. */
  cards?: DrawnCardMeta[] | null;
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
  {
    surface: string;
    overlay: string;
    inputWrap: string;
    textarea: string;
    send: string;
    glyph: string;
    skin: string;
  }
> = {
  child: {
    surface: "border border-red-800/40 bg-gradient-to-b from-red-950/35 via-red-950/20 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_10%_18%,rgba(239,68,68,0.18),transparent_34%),radial-gradient(circle_at_82%_92%,rgba(248,113,113,0.16),transparent_38%)]",
    inputWrap: "border-red-700/35 bg-red-950/20",
    textarea: "border-red-700/30 bg-red-900/20 text-red-50 placeholder:text-red-100/50",
    send: "border-red-400/30 bg-red-600/90 text-white hover:bg-red-500",
    glyph: "✦",
    skin: "chat-skin-child",
  },
  witch: {
    surface: "border border-blue-800/40 bg-gradient-to-b from-blue-950/35 via-indigo-950/20 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_14%_16%,rgba(59,130,246,0.2),transparent_34%),radial-gradient(circle_at_90%_88%,rgba(129,140,248,0.18),transparent_42%)]",
    inputWrap: "border-blue-700/35 bg-blue-950/20",
    textarea: "border-blue-700/30 bg-blue-900/20 text-blue-50 placeholder:text-blue-100/50",
    send: "border-blue-300/30 bg-blue-600/90 text-white hover:bg-blue-500",
    glyph: "☾",
    skin: "chat-skin-witch",
  },
  sage: {
    surface: "border border-amber-700/40 bg-gradient-to-b from-amber-950/30 via-zinc-900/20 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_12%_14%,rgba(251,191,36,0.2),transparent_34%),radial-gradient(circle_at_88%_90%,rgba(245,158,11,0.18),transparent_42%)]",
    inputWrap: "border-amber-600/35 bg-amber-950/15",
    textarea: "border-amber-600/30 bg-amber-900/20 text-amber-50 placeholder:text-amber-100/55",
    send: "border-amber-300/35 bg-amber-500/90 text-amber-950 hover:bg-amber-400",
    glyph: "✶",
    skin: "chat-skin-sage",
  },
  shaman: {
    surface: "border border-rose-700/40 bg-gradient-to-b from-rose-950/30 via-fuchsia-950/15 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_14%_20%,rgba(244,63,94,0.2),transparent_36%),radial-gradient(circle_at_84%_88%,rgba(225,29,72,0.18),transparent_40%)]",
    inputWrap: "border-rose-600/35 bg-rose-950/15",
    textarea: "border-rose-600/30 bg-rose-900/20 text-rose-50 placeholder:text-rose-100/55",
    send: "border-rose-300/35 bg-rose-600/90 text-white hover:bg-rose-500",
    glyph: "❋",
    skin: "chat-skin-shaman",
  },
  taoist: {
    surface: "border border-cyan-700/40 bg-gradient-to-b from-cyan-950/30 via-teal-950/15 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_84%_88%,rgba(20,184,166,0.18),transparent_42%)]",
    inputWrap: "border-cyan-600/35 bg-cyan-950/15",
    textarea: "border-cyan-600/30 bg-cyan-900/20 text-cyan-50 placeholder:text-cyan-100/55",
    send: "border-cyan-300/35 bg-cyan-600/90 text-white hover:bg-cyan-500",
    glyph: "☯",
    skin: "chat-skin-taoist",
  },
  dokkaebi: {
    surface: "border border-purple-800/40 bg-gradient-to-b from-purple-950/35 via-violet-950/20 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_18%_16%,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_86%_88%,rgba(217,70,239,0.2),transparent_40%)]",
    inputWrap: "border-purple-700/35 bg-purple-950/20",
    textarea: "border-purple-700/30 bg-purple-900/20 text-purple-50 placeholder:text-purple-100/55",
    send: "border-purple-300/35 bg-purple-600/90 text-white hover:bg-purple-500",
    glyph: "✹",
    skin: "chat-skin-dokkaebi",
  },
  hunter: {
    surface: "border border-stone-700/45 bg-gradient-to-b from-stone-900/45 via-stone-950/25 to-black/40",
    overlay: "bg-[radial-gradient(circle_at_10%_14%,rgba(120,113,108,0.24),transparent_34%),radial-gradient(circle_at_88%_90%,rgba(87,83,78,0.22),transparent_40%)]",
    inputWrap: "border-stone-600/40 bg-stone-950/25",
    textarea: "border-stone-600/35 bg-stone-900/30 text-stone-100 placeholder:text-stone-300/55",
    send: "border-stone-300/35 bg-stone-600/90 text-white hover:bg-stone-500",
    glyph: "⟁",
    skin: "chat-skin-hunter",
  },
  runeshaman: {
    surface: "border border-indigo-700/40 bg-gradient-to-b from-indigo-950/35 via-indigo-950/20 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_12%_16%,rgba(99,102,241,0.22),transparent_34%),radial-gradient(circle_at_88%_88%,rgba(67,56,202,0.2),transparent_42%)]",
    inputWrap: "border-indigo-600/35 bg-indigo-950/20",
    textarea: "border-indigo-600/30 bg-indigo-900/20 text-indigo-50 placeholder:text-indigo-100/55",
    send: "border-indigo-300/35 bg-indigo-600/90 text-white hover:bg-indigo-500",
    glyph: "ᚠ",
    skin: "chat-skin-runeshaman",
  },
  god: {
    surface: "border border-sky-700/40 bg-gradient-to-b from-sky-950/35 via-cyan-950/20 to-black/35",
    overlay: "bg-[radial-gradient(circle_at_12%_14%,rgba(14,165,233,0.22),transparent_34%),radial-gradient(circle_at_84%_90%,rgba(56,189,248,0.2),transparent_42%)]",
    inputWrap: "border-sky-600/35 bg-sky-950/20",
    textarea: "border-sky-600/30 bg-sky-900/20 text-sky-50 placeholder:text-sky-100/55",
    send: "border-sky-300/35 bg-sky-500/90 text-sky-950 hover:bg-sky-400",
    glyph: "✧",
    skin: "chat-skin-god",
  },
};

const DEFAULT_THEME = CHARACTER_THEME.witch;

export function ChatWindow({
  sessionId,
  initialMessages,
  characterId,
  onDeleteRequest,
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      cards: m.cards ?? undefined,
    })),
  );
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
        // 서버는 API_ERROR_CODES.QUOTA_EXCEEDED ("QUOTA_EXCEEDED" 대문자) 를 반환.
        // 과거 lowercase 비교 버그 때문에 quota UI 가 안 떴음 — 둘 다 허용.
        const code = String(json?.error?.code ?? "").toLowerCase();
        const isQuota = code === "quota_exceeded";
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
    <div className={cn("chat-window-skin flex h-full flex-col gap-3", theme.skin)}>
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
          "chat-panel-skin relative flex-1 space-y-4 overflow-y-auto rounded-2xl p-4 backdrop-blur-sm",
          theme.surface,
        )}
      >
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 z-0", theme.overlay)}
        />
        <div className="relative z-10">
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
                  characterId={characterId}
                />
              );
            })
          )}
        </div>
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
          className={cn(
            "chat-input-shell grid grid-cols-[1fr_auto] gap-2.5 rounded-[24px] border p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl",
            theme.inputWrap,
          )}
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
            className={cn(
              "ritual-chat-textarea chat-input-textarea resize-none outline-none leading-relaxed text-[15px] py-3 px-4 rounded-[18px]",
              "min-h-12 max-h-[120px] border",
              theme.textarea,
            )}
          />
          <button
            type="submit"
            disabled={isStreaming || isPending || input.trim().length === 0}
            aria-label={t("sendAriaLabel")}
            className={cn(
              "chat-send-button grid h-[52px] min-w-[52px] place-items-center rounded-[18px] border text-lg shadow-sm transition",
              "disabled:cursor-not-allowed disabled:opacity-40",
              theme.send,
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : theme.glyph}
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
