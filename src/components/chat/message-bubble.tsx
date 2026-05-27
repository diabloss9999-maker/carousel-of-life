"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

import { ShareButton } from "@/components/shared/share-button";
import { cn } from "@/lib/utils";
import type { CharacterId } from "@/lib/chat/characters";

export interface DrawnCardMeta {
  id: string;
  nameKo: string;
  nameEn?: string;
  imageSrc: string;
  isReversed?: boolean;
  position?: string;
}

/** 어시스턴트 메시지를 공유 카드로 만들기 위한 데이터. 직전 user 질문과 함께 묶인다. */
export interface ShareInfo {
  characterId: CharacterId;
  characterName: string;
  question: string;
  locale?: "ko" | "en";
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  characterId?: CharacterId;
  /** 점술 요청 시 뽑힌 카드 메타데이터 */
  cards?: DrawnCardMeta[];
  /** 어시스턴트 메시지가 공유 가능할 때 — 직전 user 질문 등 메타데이터 */
  share?: ShareInfo;
}

const CHARACTER_BUBBLE_CLASS: Record<CharacterId, string> = {
  child: "chat-bubble-child",
  witch: "chat-bubble-witch",
  sage: "chat-bubble-sage",
  shaman: "chat-bubble-shaman",
  taoist: "chat-bubble-taoist",
  dokkaebi: "chat-bubble-dokkaebi",
  hunter: "chat-bubble-hunter",
  runeshaman: "chat-bubble-runeshaman",
  god: "chat-bubble-god",
};

const CHARACTER_EMOJI_SRC: Record<CharacterId, string> = {
  child: "/chat-emojis/child.webp",
  witch: "/chat-emojis/witch.webp",
  sage: "/chat-emojis/sage.webp",
  shaman: "/chat-emojis/shaman.webp",
  taoist: "/chat-emojis/taoist.webp",
  dokkaebi: "/chat-emojis/dokkaebi.webp",
  hunter: "/chat-emojis/hunter.webp",
  runeshaman: "/chat-emojis/runeshaman.webp",
  god: "/chat-emojis/god.webp",
};

/**
 * 마크다운 기호·과도한 빈 줄 제거 + AI 가 누설한 시스템 마커 strip.
 *
 * 시스템 마커(`[지금 막 ... 뽑혔어]`)는 AI 에게만 주는 신호이고
 * 사용자 화면에 절대 노출되면 안 된다. 프롬프트 단에서 금지하고 있지만
 * 모델이 가끔 그대로 옮기는 경우가 있어 출력 필터로도 한 번 더 막는다.
 */
function cleanContent(text: string): string {
  return text
    .replace(/\[\s*지금 막[^\]]*뽑혔[^\]]*\]/g, "")
    .replace(/\[\s*just drew[^\]]*\]/gi, "")
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

/** 텍스트를 카드/링크에 박을 수 있게 줄여서 인코딩한다. */
function clipForShare(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? trimmed.slice(0, max - 1).trimEnd() + "…" : trimmed;
}

function buildShareParams(share: ShareInfo, answer: string): URLSearchParams {
  const sp = new URLSearchParams({
    c: share.characterId,
    q: clipForShare(share.question, 70),
    a: clipForShare(answer, 200),
  });
  if (share.locale) sp.set("locale", share.locale);
  return sp;
}

function getOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "https://carouseloflife.com";
}

function buildShareUrl(share: ShareInfo, answer: string): string {
  return `${getOrigin()}/share?${buildShareParams(share, answer).toString()}`;
}

function buildShareImageUrl(share: ShareInfo, answer: string): string {
  return `${getOrigin()}/api/share/chat?${buildShareParams(share, answer).toString()}`;
}

export function MessageBubble({ role, content, isStreaming, characterId, cards, share }: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const cleaned = cleanContent(content);
  const displayed = useTypewriter(cleaned, !!isStreaming);
  const isCursorVisible = isStreaming && displayed.length >= cleaned.length;
  const canShare = isAssistant && !isStreaming && !!share && cleaned.length > 0;
  const speakerCharacterId = isAssistant ? (characterId ?? share?.characterId) : undefined;

  return (
    <div className={cn("flex gap-2", isAssistant ? "flex-row" : "flex-row-reverse")}>
      {/* 아이콘 */}
      <div
        className={cn(
          "chat-speaker-avatar flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border mt-1",
          isAssistant
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-primary/30 bg-primary/10 text-primary",
        )}
        aria-hidden
      >
        {isAssistant && speakerCharacterId ? (
          <Image
            src={CHARACTER_EMOJI_SRC[speakerCharacterId]}
            alt=""
            width={32}
            height={32}
            className="h-full w-full object-cover"
            sizes="32px"
          />
        ) : (
          <User className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* 카드 이미지 — 점술 요청 시 */}
        {cards && cards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cards.map((card, i) => (
              <div key={`${card.id}-${i}`} className="flex flex-col items-center gap-1">
                {card.position && (
                  <p className="text-[15px] text-muted-foreground">{card.position}</p>
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
                <p className="text-[15px] text-center text-foreground/70 font-medium">
                  {card.nameKo}
                  {card.isReversed ? " ⤵" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 텍스트 버블 — ritual 스타일 */}
        <div
          className={cn(
            "ritual-message",
            isAssistant ? "oracle chat-bubble-skin" : "observer",
            speakerCharacterId && CHARACTER_BUBBLE_CLASS[speakerCharacterId],
          )}
        >
          <p className="font-mystic whitespace-pre-line leading-relaxed">
            {displayed || (isStreaming ? "" : "...")}
            {isCursorVisible && (
              <span className="inline-block w-0.5 h-[1em] ml-0.5 bg-accent align-middle animate-pulse" />
            )}
          </p>
        </div>

        {/* 어시스턴트 응답이 끝난 직후의 공유 affordance */}
        {canShare && share && (
          <div className="flex justify-end">
            <ShareButton
              title={`${share.characterName}이(가) 풀어준 이야기`}
              text={cleaned}
              url={buildShareUrl(share, cleaned)}
              imageUrl={buildShareImageUrl(share, cleaned)}
              label="공유"
              variant="ghost"
              size="sm"
              className="text-[15px] text-muted-foreground/80 hover:text-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );
}
