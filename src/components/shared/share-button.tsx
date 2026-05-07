"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** 공유할 제목 (Web Share dialog 헤더). */
  title: string;
  /** 공유할 본문 텍스트. */
  text: string;
  /** 공유할 URL. 기본값: 현재 페이지 origin. */
  url?: string;
  /** 버튼 라벨. 기본 '공유'. */
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * 결과 공유 버튼.
 *
 * - 모바일·지원 브라우저: Web Share API (카톡/메시지/메일 등 native dialog)
 * - 미지원: 클립보드에 텍스트 복사 + "복사됨" 토스트
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
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl =
      url ?? (typeof window !== "undefined" ? window.location.origin : "");
    const shareText = `${text}\n\n— 인생의 회전목마\n${shareUrl}`;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (e) {
        // 사용자가 dialog 닫음 — silent.
        if (e instanceof Error && e.name !== "AbortError") {
          // fallthrough to clipboard.
        } else {
          return;
        }
      }
    }

    // 클립보드 fallback.
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn("gap-1.5", className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          <span>복사됨</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
