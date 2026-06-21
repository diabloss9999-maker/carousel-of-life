"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

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

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  /** 점술 요청 시 뽑힌 카드 메타데이터 */
  cards?: DrawnCardMeta[];
  /** 현재 세션 멤버 (버블 테마용) */
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

const CAROUSEL_STICKER_SRC = {
  ":carousel_happy:": "/characters/idols/emoji/carousel-happy.png",
  ":carousel_cheer:": "/characters/idols/emoji/carousel-cheer.png",
  ":carousel_shy:": "/characters/idols/emoji/carousel-shy.png",
  ":carousel_comfort:": "/characters/idols/emoji/carousel-comfort.png",
  ":carousel_surprise:": "/characters/idols/emoji/carousel-surprise.png",
  ":carousel_wink:": "/characters/idols/emoji/carousel-wink.png",
  ":carousel_pout:": "/characters/idols/emoji/carousel-pout.png",
  ":carousel_sleepy:": "/characters/idols/emoji/carousel-sleepy.png",
  ":carousel_love:": "/characters/idols/emoji/carousel-love.png",
} as const;

const CAROUSEL_STICKER_RE =
  /(:carousel_(?:happy|cheer|shy|comfort|surprise|wink|pout|sleepy|love):)/g;

function StickerText({ text }: { text: string }) {
  const parts = text.split(CAROUSEL_STICKER_RE);
  const stickerOnly =
    parts.filter((part) => part.trim().length > 0).every((part) =>
      Boolean(CAROUSEL_STICKER_SRC[part as keyof typeof CAROUSEL_STICKER_SRC]),
    );

  return (
    <p
      className={cn(
        "font-mystic whitespace-pre-wrap leading-relaxed",
        stickerOnly && "leading-none",
      )}
    >
      {parts.map((part, index) => {
        const src = CAROUSEL_STICKER_SRC[part as keyof typeof CAROUSEL_STICKER_SRC];
        if (!src) return <span key={`${part}-${index}`}>{part}</span>;

        return (
          <Image
            key={`${part}-${index}`}
            src={src}
            alt=""
            width={72}
            height={72}
            className={cn(
              "inline-block object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)]",
              stickerOnly
                ? "mx-1 h-20 w-20 align-middle sm:h-24 sm:w-24"
                : "mx-1 h-12 w-12 translate-y-[0.38em] sm:h-14 sm:w-14",
            )}
            sizes={stickerOnly ? "(max-width: 640px) 80px, 96px" : "(max-width: 640px) 48px, 56px"}
          />
        );
      })}
    </p>
  );
}

/**
 * 카카오톡 스타일 "입력 중…" 표시.
 *
 * 멤버가 답을 작성하는 동안 점 세 개가 순차적으로 통통 튄다.
 * 응답이 완성되면 메시지를 한 번에 노출한다 (타자기 효과 없음).
 */
function TypingDots({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 py-1.5"
      role="status"
      aria-label={label}
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55 [animation-delay:160ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55 [animation-delay:320ms]" />
    </span>
  );
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
    label: "Leader Note",
  },
  witch: {
    icon: "border-blue-300/40 bg-blue-500/20 text-blue-100",
    oracleBubble: "border-blue-300/30 bg-[linear-gradient(130deg,rgba(96,165,250,0.24),rgba(30,58,138,0.2)_55%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-indigo-200/30 bg-[linear-gradient(135deg,rgba(191,219,254,0.25),rgba(49,46,129,0.18)_55%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-blue-300/40",
    label: "Vocal Note",
  },
  sage: {
    icon: "border-amber-300/45 bg-amber-400/20 text-amber-100",
    oracleBubble: "border-amber-300/30 bg-[linear-gradient(125deg,rgba(253,230,138,0.22),rgba(120,53,15,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-amber-200/30 bg-[linear-gradient(135deg,rgba(254,243,199,0.24),rgba(120,53,15,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-amber-300/45",
    label: "Performer Note",
  },
  shaman: {
    icon: "border-rose-300/40 bg-rose-500/20 text-rose-100",
    oracleBubble: "border-rose-300/30 bg-[linear-gradient(128deg,rgba(251,113,133,0.23),rgba(136,19,55,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-rose-200/30 bg-[linear-gradient(135deg,rgba(254,205,211,0.24),rgba(136,19,55,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-rose-300/40",
    label: "Producer Note",
  },
  taoist: {
    icon: "border-cyan-300/40 bg-cyan-500/20 text-cyan-100",
    oracleBubble: "border-cyan-300/30 bg-[linear-gradient(130deg,rgba(103,232,249,0.23),rgba(15,118,110,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-cyan-200/30 bg-[linear-gradient(135deg,rgba(207,250,254,0.24),rgba(15,118,110,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-cyan-300/40",
    label: "Mood Note",
  },
  dokkaebi: {
    icon: "border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100",
    oracleBubble: "border-purple-300/30 bg-[linear-gradient(130deg,rgba(216,180,254,0.24),rgba(88,28,135,0.2)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-purple-200/30 bg-[linear-gradient(135deg,rgba(233,213,255,0.24),rgba(88,28,135,0.18)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-purple-300/40",
    label: "Rap Note",
  },
  hunter: {
    icon: "border-stone-300/40 bg-stone-500/20 text-stone-100",
    oracleBubble: "border-stone-300/30 bg-[linear-gradient(130deg,rgba(214,211,209,0.2),rgba(41,37,36,0.3)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-stone-200/30 bg-[linear-gradient(135deg,rgba(231,229,228,0.22),rgba(41,37,36,0.24)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-stone-300/35",
    label: "Analyst Note",
  },
  runeshaman: {
    icon: "border-indigo-300/40 bg-indigo-500/20 text-indigo-100",
    oracleBubble: "border-indigo-300/30 bg-[linear-gradient(128deg,rgba(165,180,252,0.22),rgba(49,46,129,0.26)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-indigo-200/30 bg-[linear-gradient(135deg,rgba(224,231,255,0.24),rgba(49,46,129,0.2)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-indigo-300/40",
    label: "Youngest Note",
  },
  god: {
    icon: "border-sky-300/40 bg-sky-500/20 text-sky-100",
    oracleBubble: "border-sky-300/30 bg-[linear-gradient(128deg,rgba(125,211,252,0.22),rgba(3,105,161,0.24)_58%,rgba(0,0,0,0.24))] rounded-bl-[10px]",
    observerBubble: "border-sky-200/30 bg-[linear-gradient(135deg,rgba(224,242,254,0.24),rgba(3,105,161,0.2)_56%,rgba(0,0,0,0.22))] rounded-br-[10px]",
    cardsRing: "ring-sky-300/40",
    label: "Dance Note",
  },
};

const DEFAULT_ORACLE_THEME = ORACLE_BUBBLE_THEME.witch;

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
  child: "/characters/idols/stickers/child.sticker.png",
  witch: "/characters/idols/stickers/witch.sticker.png",
  sage: "/characters/idols/stickers/sage.sticker.png",
  shaman: "/characters/idols/stickers/shaman.sticker.png",
  taoist: "/characters/idols/stickers/taoist.sticker.png",
  dokkaebi: "/characters/idols/stickers/dokkaebi.sticker.png",
  hunter: "/characters/idols/stickers/hunter.sticker.png",
  runeshaman: "/characters/idols/stickers/runeshaman.sticker.png",
  god: "/characters/idols/stickers/god.sticker.png",
};

export function MessageBubble({
  role,
  content,
  isStreaming,
  cards,
  characterId,
}: MessageBubbleProps) {
  const tChars = useTranslations("characters");
  const t = useTranslations("chatShell");
  const isAssistant = role === "assistant";
  const oracleTheme = characterId
    ? (ORACLE_BUBBLE_THEME[characterId] ?? DEFAULT_ORACLE_THEME)
    : DEFAULT_ORACLE_THEME;
  const speakerCharacterId = isAssistant ? characterId : undefined;
  const cleaned = cleanContent(content);
  const displayText = isAssistant
    ? cleaned.replace(CAROUSEL_STICKER_RE, "").trim()
    : cleaned;

  return (
    <div className={cn("flex gap-2", isAssistant ? "flex-row" : "flex-row-reverse")}>
      {/* 아이콘 */}
      <div
        className={cn(
          "chat-speaker-avatar mt-1 flex shrink-0 items-center justify-center",
          speakerCharacterId
            ? "chat-speaker-sticker h-12 w-12 overflow-visible"
            : cn(
                "h-8 w-8 overflow-hidden rounded-full",
                "border",
                isAssistant ? oracleTheme.icon : "border-primary/30 bg-primary/10 text-primary",
              ),
        )}
        aria-hidden
      >
        {speakerCharacterId ? (
          <Image
            src={CHARACTER_EMOJI_SRC[speakerCharacterId]}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.28)]"
            sizes="48px"
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
        {isAssistant && characterId && (
          <p className="text-[15px] font-mystic font-semibold tracking-wide text-foreground/60">
            {tChars(`${characterId}.name`)}
          </p>
        )}
        <div
          className={cn(
            "ritual-message",
            isAssistant ? "oracle chat-bubble-skin" : "observer",
            isAssistant ? oracleTheme.oracleBubble : oracleTheme.observerBubble,
            speakerCharacterId && CHARACTER_BUBBLE_CLASS[speakerCharacterId],
          )}
        >
          {isAssistant && isStreaming ? (
            <TypingDots label={t("typing")} />
          ) : isAssistant ? (
            <p className="font-mystic whitespace-pre-wrap leading-relaxed">
              {displayText || "..."}
            </p>
          ) : (
            <StickerText text={displayText || "..."} />
          )}
        </div>
      </div>
    </div>
  );
}
