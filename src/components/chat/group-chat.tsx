"use client";

/**
 * Carousel Nine 단체방 — 9명이 함께 있는 단체 채팅.
 *
 * 팬이 메시지를 보내면 2~4명이 한 명씩 톡톡 등장한다(서버에서 1콜로 생성한
 * 대본을 순차 공개). 멤버별 말풍선은 MessageBubble 을 재사용한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, User, X } from "lucide-react";
import { track } from "@vercel/analytics";

import { ChatEmojiPicker } from "@/components/chat/chat-emoji-picker";
import { MessageBubble } from "@/components/chat/message-bubble";
import { cn } from "@/lib/utils";
import type { CharacterId } from "@/lib/chat/characters";

const MAX_MESSAGE_LENGTH = 100;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const REVEAL_GAP_MS = 650;
const MENTION_CHIPS: { id: CharacterId; name: string }[] = [
  { id: "child", name: "이안" },
  { id: "witch", name: "유준" },
  { id: "sage", name: "도윤" },
  { id: "shaman", name: "재하" },
  { id: "taoist", name: "하루" },
  { id: "dokkaebi", name: "시온" },
  { id: "god", name: "태오" },
  { id: "hunter", name: "이현" },
  { id: "runeshaman", name: "하민" },
];

export interface GroupMessage {
  id: string;
  role: "user" | "member";
  speaker?: CharacterId;
  content: string;
  imageDataUrl?: string;
  imageMimeType?: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

interface GroupChatProps {
  initialMessages: GroupMessage[];
  chatUsage?: {
    used: number;
    max: number;
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function compressImage(file: File): Promise<{
  dataUrl: string;
  mimeType: "image/jpeg";
}> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.82),
    mimeType: "image/jpeg",
  };
}

function UserPhotoBubble({ content, imageDataUrl }: { content: string; imageDataUrl: string }) {
  return (
    <div className="flex flex-row-reverse gap-2">
      <div
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary/10 text-primary"
        aria-hidden
      >
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 max-w-[78%] space-y-2">
        <div className="ritual-message observer overflow-hidden p-2">
          <div className="relative aspect-[4/5] max-h-[360px] w-full min-w-[180px] overflow-hidden rounded-[18px] border border-white/15 bg-black/20 sm:min-w-[240px]">
            <Image
              src={imageDataUrl}
              alt="사용자가 보낸 사진"
              fill
              unoptimized
              sizes="(max-width: 640px) 78vw, 320px"
              className="object-cover"
            />
          </div>
          {content.trim() ? (
            <p className="font-mystic mt-3 whitespace-pre-wrap px-2 pb-1 leading-relaxed">
              {content}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GroupChat({ initialMessages, chatUsage }: GroupChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    mimeType: "image/jpeg";
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatUsed, setChatUsed] = useState(chatUsage?.used ?? 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !sending) {
        e.currentTarget.closest("form")?.requestSubmit();
      }
    }
  }

  function sendEmoji(token: string) {
    void sendMessage(token, false);
  }

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendMessage(input.trim(), true, selectedImage);
  }

  async function sendMessage(
    text: string,
    clearComposer: boolean,
    image?: { dataUrl: string; mimeType: "image/jpeg" } | null,
  ) {
    if ((!text && !image) || sending) return;
    const usageCost = image ? 3 : 2;
    if (chatUsage && chatUsed + usageCost > chatUsage.max) {
      setError(`오늘 남은 대화가 부족해. ${usageCost}회가 필요해.`);
      return;
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`메시지는 ${MAX_MESSAGE_LENGTH}자 이내로 부탁해.`);
      return;
    }

    track("chat_message_submit", {
      mode: "group",
      hasImage: Boolean(image),
      source: clearComposer ? "composer" : "emoji",
    });

    setError(null);
    if (clearComposer) {
      setInput("");
      setSelectedImage(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    if (textareaRef.current && clearComposer) textareaRef.current.style.height = "auto";
    requestAnimationFrame(() => textareaRef.current?.focus());

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text || (image ? "사진을 올렸어요." : text),
        imageDataUrl: image?.dataUrl,
        imageMimeType: image?.mimeType,
      },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/chat/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          image: image
            ? {
                dataUrl: image.dataUrl,
                mimeType: image.mimeType,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        track("chat_message_error", {
          mode: "group",
          hasImage: Boolean(image),
          reason: "api_error",
        });
        setError(json?.error?.message ?? "멤버들이 잠깐 자리를 비웠어요. 다시 시도해줘.");
        return;
      }

      if (chatUsage) {
        setChatUsed((prev) => Math.min(chatUsage.max, prev + usageCost));
      }

      const data = (await res.json()) as {
        turns: { speaker: CharacterId; name: string; content: string }[];
      };

      // 한 명씩 톡톡 등장.
      for (const turn of data.turns) {
        await delay(REVEAL_GAP_MS);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "member",
            speaker: turn.speaker,
            content: turn.content,
          },
        ]);
      }
      track("chat_message_success", {
        mode: "group",
        hasImage: Boolean(image),
        turns: data.turns.length,
      });
      router.refresh();
    } catch {
      track("chat_message_error", {
        mode: "group",
        hasImage: Boolean(image),
        reason: "network_error",
      });
      setError("연결이 잠깐 흔들렸어요. 다시 시도해줘.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function handleImageFile(file: File | undefined) {
    if (!file || sending) return;
    if (!file.type.startsWith("image/")) {
      setError("사진 파일만 올릴 수 있어.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("사진이 너무 커. 8MB 이하 이미지로 부탁해.");
      return;
    }

    setError(null);
    try {
      const compressed = await compressImage(file);
      setSelectedImage(compressed);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch {
      setError("사진을 읽지 못했어. 다른 사진으로 다시 시도해줘.");
    }
  }

  function insertMention(name: string) {
    if (sending) return;
    setInput((prev) => {
      const trimmedEnd = prev.replace(/\s+$/g, "");
      const prefix = trimmedEnd.length > 0 ? `${trimmedEnd} ` : "";
      const next = `${prefix}@${name} `;
      return next.length > MAX_MESSAGE_LENGTH ? prev : next;
    });
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      adjustHeight();
    });
  }

  const charsLeft = MAX_MESSAGE_LENGTH - input.length;
  const currentUsageCost = selectedImage ? 3 : 2;
  const chatRemaining = chatUsage
    ? Math.max(chatUsage.max - chatUsed, 0)
    : null;
  const quotaBlocked =
    chatRemaining !== null && chatRemaining < currentUsageCost;

  return (
    <div className="chat-window-skin chat-skin-witch mobile-chat-window flex h-full flex-col gap-3">
      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        className="chat-panel-skin mobile-chat-panel relative flex-1 space-y-4 overflow-y-auto rounded-2xl p-4 backdrop-blur-sm"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="relative aspect-[16/9] w-full max-w-xs overflow-hidden rounded-2xl border border-white/25 shadow-lg">
              <Image
                src="/characters/idols/group-chat.png"
                alt="Carousel Nine 멤버들"
                fill
                sizes="320px"
                className="img-shimmer object-cover"
              />
            </div>
            <p className="font-mystic text-base font-semibold text-foreground/70">
              9명이 모두 모여 있어요.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground/60">
              한마디 던지면 멤버들이 우르르 답해줄 거예요.
            </p>
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" && m.imageDataUrl ? (
              <UserPhotoBubble
                key={m.id}
                content={m.content === "사진을 올렸어요." ? "" : m.content}
                imageDataUrl={m.imageDataUrl}
              />
            ) : m.role === "user" ? (
              <MessageBubble key={m.id} role="user" content={m.content} />
            ) : (
              <MessageBubble
                key={m.id}
                role="assistant"
                content={m.content}
                characterId={m.speaker}
              />
            ),
          )
        )}

        {sending && (
          <div className="flex items-center gap-2 pl-10 text-[13px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55 [animation-delay:160ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55 [animation-delay:320ms]" />
            </span>
            멤버들이 답하고 있어요…
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-50/5 px-3 py-2 text-[15px] text-amber-300/90">
          {error}
        </p>
      )}

      {/* 입력창 */}
      <form onSubmit={handleSend} className="mobile-chat-form flex flex-col gap-1.5">
        <div
          className="group-mention-strip flex gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="멤버 태그"
        >
          {MENTION_CHIPS.map((member) => (
            <button
              key={member.id}
              type="button"
              disabled={sending}
              onClick={() => insertMention(member.name)}
              className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[13px] font-medium text-foreground/80 backdrop-blur transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              @{member.name}
            </button>
          ))}
        </div>
        {selectedImage && (
          <div className="flex items-end gap-2 rounded-[22px] border border-white/15 bg-white/[0.06] p-2.5 backdrop-blur-xl">
            <div className="relative h-24 w-20 overflow-hidden rounded-[16px] border border-white/20 bg-black/20">
              <Image
                src={selectedImage.dataUrl}
                alt="전송할 사진 미리보기"
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-[13px] font-medium text-foreground/80">
                사진 단톡
              </p>
              <p className="text-[13px] text-muted-foreground/70">
                안전한 사진만 대화 3개 차감. 민감 사진은 차감 없이 거절해요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-foreground/75 transition hover:bg-white/15"
              aria-label="사진 제거"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {chatUsage ? (
          <div
            className={cn(
              "grid grid-cols-[1fr_auto] gap-3 rounded-2xl border px-3 py-2 text-[13px]",
              quotaBlocked
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : chatRemaining !== null && chatRemaining <= 4
                  ? "border-amber-400/30 bg-amber-50/5 text-amber-200"
                  : "border-white/10 bg-white/[0.06] text-muted-foreground",
            )}
          >
            <span>오늘 남은 대화</span>
            <span className="font-semibold tabular-nums text-foreground">
              {chatRemaining} / {chatUsage.max}회
            </span>
          </div>
        ) : null}
        <div className="chat-input-shell group-chat-input-shell flex items-end gap-2 rounded-[24px] border p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleImageFile(e.target.files?.[0]);
            }}
          />
          <button
            type="button"
            disabled={sending || quotaBlocked}
            onClick={() => fileRef.current?.click()}
            aria-label="사진 추가"
            className={cn(
              "chat-tool-button group-chat-photo-button grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[18px] border text-foreground/75 transition hover:text-foreground",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <div className="group-chat-text-field relative min-w-0 flex-1">
            <ChatEmojiPicker
              inline
              onSelect={sendEmoji}
              disabled={sending}
              className="group-chat-emoji-button absolute bottom-1 left-1 z-10"
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력"
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={sending || quotaBlocked}
              rows={1}
              className="ritual-chat-textarea chat-input-textarea group-chat-textarea max-h-[120px] min-h-12 w-full resize-none rounded-[18px] border py-3 pl-[52px] pr-4 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            data-keep-color
            disabled={
              sending ||
              quotaBlocked ||
              (input.trim().length === 0 && !selectedImage)
            }
            aria-label="메시지 보내기"
            className={cn(
              "chat-send-button group-chat-send-button grid h-[52px] min-w-[52px] shrink-0 place-items-center rounded-[18px] border text-lg shadow-sm transition",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "♪"}
          </button>
        </div>
        <div className="flex items-center justify-between px-1 text-[13px]">
          <span className="text-muted-foreground/70">
            {selectedImage ? "사진 단톡은 대화 3개가 차감돼요" : "단체방은 대화 2개가 차감돼요"}
          </span>
          <span
            className={cn(
              "tabular-nums",
              charsLeft <= 0
                ? "font-medium text-destructive"
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
