"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

const KAKAO_OPENCHAT_URL = "https://invite.kakao.com/tc/W5meqEedOZ";

/**
 * 결과 공유 버튼.
 *
 * 드롭다운으로 3가지 공유 옵션 제공:
 * 1) 카카오 오픈채팅에 공유 (텍스트 복사 + 채팅방 오픈)
 * 2) 카카오톡/전체 공유 (Web Share API)
 * 3) 링크 복사 (클립보드)
 */
export function ShareButton({
  title,
  text,
  url,
  label = "공유하기",
  variant = "outline",
  size = "sm",
  className,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");
  const ref = useRef<HTMLDivElement>(null);

  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.origin : "https://carouseloflife.com");
  const shareText = `${text}\n\n— 인생의 회전목마\n${shareUrl}`;

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch {
      return false;
    }
  }

  /** 카카오 오픈채팅에 공유 — 텍스트 복사 후 채팅방 오픈 */
  async function handleKakaoChat() {
    setOpen(false);
    await copyToClipboard();
    window.open(KAKAO_OPENCHAT_URL, "_blank", "noopener,noreferrer");
    setStatus("copied");
    setTimeout(() => setStatus("idle"), 3000);
  }

  /** 네이티브 공유 (카카오톡 포함) */
  async function handleNativeShare() {
    setOpen(false);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    // fallback: 클립보드
    await copyToClipboard();
    setStatus("copied");
    setTimeout(() => setStatus("idle"), 2000);
  }

  /** 링크만 복사 */
  async function handleCopyLink() {
    setOpen(false);
    await navigator.clipboard.writeText(`${shareText}`);
    setStatus("copied");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen((v) => !v)}
        className={cn("gap-1.5", className)}
      >
        {status === "copied" ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" aria-hidden />
            <span>복사됨</span>
          </>
        ) : status === "shared" ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" aria-hidden />
            <span>공유됨</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" aria-hidden />
            <span>{label}</span>
          </>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-52 rounded-xl border border-border/60 bg-popover shadow-xl overflow-hidden">
          {/* ① 카카오 오픈채팅 */}
          <button
            type="button"
            onClick={handleKakaoChat}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors border-b border-border/40"
          >
            <span className="text-base leading-none" />
            <div>
              <p className="font-medium text-[15px]">카카오 오픈채팅에 공유</p>
              <p className="text-[15px] text-muted-foreground mt-0.5">텍스트 복사 후 채팅방 오픈</p>
            </div>
          </button>

          {/* ② 카카오톡/전체 공유 */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors border-b border-border/40"
          >
            <MessageCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-[15px]">카카오톡으로 공유</p>
              <p className="text-[15px] text-muted-foreground mt-0.5">친구·채팅방에 직접 공유</p>
            </div>
          </button>

          {/* ③ 링크 복사 */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors"
          >
            <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-[15px]">링크 복사</p>
              <p className="text-[15px] text-muted-foreground mt-0.5">텍스트를 클립보드에 복사</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
