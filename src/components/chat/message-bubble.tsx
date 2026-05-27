"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Sparkles, User } from "lucide-react";

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
  /** 점술 요청 시 뽑힌 카드 메타데이터 */
  cards?: DrawnCardMeta[];
  /** 어시스턴트 메시지가 공유 가능할 때 — 직전 user 질문 등 메타데이터 */
  share?: ShareInfo;
  /** 현재 세션 점술사 (버블 테마용) */
  characterId?: CharacterId;
}

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

const ORACLE_BUBBLE_THEME: Record<
  CharacterId,
  {
    icon: string;
    oracleBubble: string;
    observerBubble: string;
    cardsRing: string;
    label: string;
  }
> = {
  child: {
    icon: "border-red-300/40 bg-red-500/20 text-red-100",
    oracleBubble: "border-red-300/30 bg-[linear-gradient(125deg,rgba(248,113,113,0.24),rgba(127,29,29,0.2)_55%,rgba(0,0,0,0.25))] rounded-bl-[10px]",
    observerBubble: "border-red-200/30 bg-[linear-gradient(135deg,rgba(254,202,202,0.28),rgba(127,29,29,0.18)_55%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-red-300/40",
    label: "Pact Trace",
  },
  witch: {
    icon: "border-blue-300/40 bg-blue-500/20 text-blue-100",
    oracleBubble: "border-blue-300/30 bg-[linear-gradient(130deg,rgba(96,165,250,0.24),rgba(30,58,138,0.2)_55%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-indigo-200/30 bg-[linear-gradient(135deg,rgba(191,219,254,0.25),rgba(49,46,129,0.18)_55%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-blue-300/40",
    label: "Moon Script",
  },
  sage: {
    icon: "border-amber-300/45 bg-amber-400/20 text-amber-100",
    oracleBubble: "border-amber-300/30 bg-[linear-gradient(125deg,rgba(253,230,138,0.22),rgba(120,53,15,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-amber-200/30 bg-[linear-gradient(135deg,rgba(254,243,199,0.24),rgba(120,53,15,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-amber-300/45",
    label: "Aether Note",
  },
  shaman: {
    icon: "border-rose-300/40 bg-rose-500/20 text-rose-100",
    oracleBubble: "border-rose-300/30 bg-[linear-gradient(128deg,rgba(251,113,133,0.23),rgba(136,19,55,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-rose-200/30 bg-[linear-gradient(135deg,rgba(254,205,211,0.24),rgba(136,19,55,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-rose-300/40",
    label: "Spirit Echo",
  },
  taoist: {
    icon: "border-cyan-300/40 bg-cyan-500/20 text-cyan-100",
    oracleBubble: "border-cyan-300/30 bg-[linear-gradient(130deg,rgba(103,232,249,0.23),rgba(15,118,110,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-cyan-200/30 bg-[linear-gradient(135deg,rgba(207,250,254,0.24),rgba(15,118,110,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-cyan-300/40",
    label: "Sky Ledger",
  },
  dokkaebi: {
    icon: "border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100",
    oracleBubble: "border-purple-300/30 bg-[linear-gradient(130deg,rgba(216,180,254,0.24),rgba(88,28,135,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-purple-200/30 bg-[linear-gradient(135deg,rgba(233,213,255,0.24),rgba(88,28,135,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-purple-300/40",
    label: "Underflame",
  },
  hunter: {
    icon: "border-stone-300/40 bg-stone-500/20 text-stone-100",
    oracleBubble: "border-stone-300/30 bg-[linear-gradient(130deg,rgba(214,211,209,0.2),rgba(41,37,36,0.3)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-stone-200/30 bg-[linear-gradient(135deg,rgba(231,229,228,0.22),rgba(41,37,36,0.24)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-stone-300/35",
    label: "Snow Track",
  },
  runeshaman: {
    icon: "border-indigo-300/40 bg-indigo-500/20 text-indigo-100",
    oracleBubble: "border-indigo-300/30 bg-[linear-gradient(128deg,rgba(165,180,252,0.22),rgba(49,46,129,0.26)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-indigo-200/30 bg-[linear-gradient(135deg,rgba(224,231,255,0.24),rgba(49,46,129,0.2)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-indigo-300/40",
    label: "Rune Grid",
  },
  god: {
    icon: "border-sky-300/40 bg-sky-500/20 text-sky-100",
    oracleBubble: "border-sky-300/30 bg-[linear-gradient(128deg,rgba(125,211,252,0.22),rgba(3,105,161,0.24)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-sky-200/30 bg-[linear-gradient(135deg,rgba(224,242,254,0.24),rgba(3,105,161,0.2)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-sky-300/40",
    label: "Frost Oath",
  },
};

const DEFAULT_ORACLE_THEME = ORACLE_BUBBLE_THEME.witch;

export function MessageBubble({
  role,
  content,
  isStreaming,
  cards,
  share,
  characterId,
}: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const oracleTheme = characterId
    ? (ORACLE_BUBBLE_THEME[characterId] ?? DEFAULT_ORACLE_THEME)
    : DEFAULT_ORACLE_THEME;
  const cleaned = cleanContent(content);
  const displayed = useTypewriter(cleaned, !!isStreaming);
  const isCursorVisible = isStreaming && displayed.length >= cleaned.length;
  const canShare = isAssistant && !isStreaming && !!share && cleaned.length > 0;

  return (
    <div className={cn("flex gap-2", isAssistant ? "flex-row" : "flex-row-reverse")}>
      {/* 아이콘 */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border mt-1",
          isAssistant
            ? oracleTheme.icon
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
                  <p className="text-[15px] text-muted-foreground">{card.position}</p>
                )}
                <div className={cn("relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-lg ring-1", oracleTheme.cardsRing)}>
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
        {isAssistant && (
          <p className="text-[15px] uppercase tracking-[0.16em] text-foreground/45">
            {oracleTheme.label}
          </p>
        )}
        <div
          className={cn(
            "ritual-message",
            isAssistant ? "oracle" : "observer",
            isAssistant ? oracleTheme.oracleBubble : oracleTheme.observerBubble,
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
