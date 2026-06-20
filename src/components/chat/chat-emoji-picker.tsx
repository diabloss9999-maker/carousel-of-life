"use client";

import { useState } from "react";
import Image from "next/image";
import { Smile } from "lucide-react";

import { cn } from "@/lib/utils";

export const CHAT_EMOJI_ITEMS = [
  {
    token: ":carousel_happy:",
    label: "기분 좋아",
    src: "/characters/idols/emoji/carousel-happy.png",
  },
  {
    token: ":carousel_cheer:",
    label: "응원",
    src: "/characters/idols/emoji/carousel-cheer.png",
  },
  {
    token: ":carousel_shy:",
    label: "부끄러워",
    src: "/characters/idols/emoji/carousel-shy.png",
  },
  {
    token: ":carousel_comfort:",
    label: "위로",
    src: "/characters/idols/emoji/carousel-comfort.png",
  },
  {
    token: ":carousel_surprise:",
    label: "놀람",
    src: "/characters/idols/emoji/carousel-surprise.png",
  },
  {
    token: ":carousel_wink:",
    label: "윙크",
    src: "/characters/idols/emoji/carousel-wink.png",
  },
  {
    token: ":carousel_pout:",
    label: "삐짐",
    src: "/characters/idols/emoji/carousel-pout.png",
  },
  {
    token: ":carousel_sleepy:",
    label: "졸림",
    src: "/characters/idols/emoji/carousel-sleepy.png",
  },
  {
    token: ":carousel_love:",
    label: "좋아해",
    src: "/characters/idols/emoji/carousel-love.png",
  },
] as const;

interface ChatEmojiPickerProps {
  onSelect: (token: string) => void;
  disabled?: boolean;
  inline?: boolean;
  className?: string;
}

export function ChatEmojiPicker({
  onSelect,
  disabled = false,
  inline = false,
  className,
}: ChatEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "chat-emoji-picker",
        inline
          ? "relative grid h-[52px] w-[52px] shrink-0 place-items-center"
          : "flex w-fit max-w-full items-center gap-1 overflow-hidden rounded-[22px] border border-white/15 bg-white/10 p-1.5 shadow-sm backdrop-blur-xl transition-all",
        !inline && open ? "pr-2" : "",
        className,
      )}
      aria-label="팬 이모지"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        title="팬 이모지"
        aria-label="팬 이모지 열기"
        aria-expanded={open}
        className={cn(
          "chat-emoji-toggle grid shrink-0 place-items-center rounded-[16px] text-foreground/80 transition hover:bg-white/12",
          inline
            ? "h-[52px] w-[52px] border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
            : "h-10 w-10 sm:h-11 sm:w-11",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <Smile className="h-5 w-5" aria-hidden />
      </button>

      <div
        className={cn(
          "flex min-w-0 gap-1 overflow-x-auto transition-all duration-300 ease-out [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          inline
            ? "chat-emoji-tray absolute bottom-[calc(100%+0.5rem)] left-0 z-30 rounded-[20px] border border-white/15 bg-background/85 p-1.5 shadow-xl backdrop-blur-xl"
            : "",
          open
            ? inline
              ? "max-w-[min(31rem,calc(100vw-2rem))] opacity-100"
              : "max-w-[min(31rem,calc(100vw-6rem))] opacity-100"
            : inline
              ? "pointer-events-none max-w-0 opacity-0"
              : "max-w-0 opacity-0",
        )}
      >
        {CHAT_EMOJI_ITEMS.map((item) => (
          <button
            key={item.token}
            type="button"
            disabled={disabled || !open}
            onClick={() => onSelect(item.token)}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-[16px] transition hover:-translate-y-0.5 hover:bg-white/12 sm:h-14 sm:w-14",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
            )}
          >
            <Image
              src={item.src}
              alt=""
              width={44}
              height={44}
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
              sizes="(max-width: 640px) 40px, 44px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
