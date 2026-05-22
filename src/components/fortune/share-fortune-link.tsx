"use client";

/**
 * 운세 공유 페이지 링크 버튼.
 *
 * 클릭 → /api/share/create POST → short token URL 발급
 * → Web Share API 시도 (모바일: 카카오톡·메신저 시트)
 * → 미지원 시 클립보드 복사 + 토스트
 *
 * ShareButton 과 별도 — 친구가 이미지가 아닌 "운세 미리보기 페이지"를 받게 한다.
 * 가입 CTA 가 따라가서 친구 초대 시스템 연동.
 */
import { useState } from "react";
import { Check, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareFortuneLinkProps {
  fortuneId: string;
  /** 시스템 공유 시 함께 보낼 본문 메시지. */
  shareText?: string;
  /** 시스템 공유 시 제목. */
  shareTitle?: string;
  className?: string;
}

export function ShareFortuneLink({
  fortuneId,
  shareText,
  shareTitle = "오늘의 운세 — 인생의 회전목마",
  className,
}: ShareFortuneLinkProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "shared" | "copied">(
    "idle",
  );

  async function handleClick() {
    if (status === "loading") return;
    setStatus("loading");

    let shareUrl: string;
    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fortuneId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message ?? "공유 링크 생성 실패");
      }
      shareUrl = json.data.url as string;
    } catch (e) {
      console.error("[share-fortune-link] create failed", e);
      toast.error("공유 링크 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setStatus("idle");
      return;
    }

    // Web Share API 우선
    const canShare = typeof navigator !== "undefined" && !!navigator.share;
    if (canShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText ?? "내 오늘의 운세를 봐줘",
          url: shareUrl,
        });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          setStatus("idle");
          return;
        }
        // fall through to clipboard
      }
    }

    // 폴백 — 클립보드 복사
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("공유 링크를 복사했어요");
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      toast.error("복사에 실패했어요. 링크를 직접 복사해 주세요.");
      setStatus("idle");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={status === "loading"}
      className={cn("gap-1.5", className)}
    >
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : status === "shared" || status === "copied" ? (
        <Check className="h-4 w-4 text-emerald-500" aria-hidden />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden />
      )}
      {status === "loading"
        ? "준비 중…"
        : status === "shared"
          ? "공유됨"
          : status === "copied"
            ? "복사됨"
            : "친구에게 보내기"}
    </Button>
  );
}
