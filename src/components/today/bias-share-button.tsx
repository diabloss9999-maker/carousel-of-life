"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import type { DailyMessageTone } from "@/lib/daily-message/service";

interface BiasShareButtonProps {
  name: string;
  opener: string;
  insight: string;
  signOff: string;
  tone: DailyMessageTone;
}

/** KST 오늘 날짜(YYYY.MM.DD). */
function todayLabel(): string {
  const d = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  return d.replace(/-/g, ".");
}

/**
 * 최애 한마디를 인스타 스토리 카드 이미지로 공유한다.
 * - Web Share API(파일 공유) 지원 시 바로 공유 시트.
 * - 미지원이면 이미지 새 탭으로 열어 저장 유도.
 */
export function BiasShareButton({
  name,
  opener,
  insight,
  signOff,
  tone,
}: BiasShareButtonProps) {
  const [busy, setBusy] = useState(false);

  function buildUrl(): string {
    const params = new URLSearchParams({
      name,
      opener,
      insight,
      signOff,
      tone,
      date: todayLabel(),
    });
    return `/api/share/today-message?${params.toString()}`;
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    const url = buildUrl();
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], "carousel-today.png", {
        type: blob.type || "image/png",
      });
      const shareData = {
        files: [file],
        text: `${name}의 오늘 한마디 · 인생의 회전목마`,
      };
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground disabled:opacity-60"
    >
      <Share2 className="h-3.5 w-3.5" aria-hidden />
      {busy ? "준비 중…" : "스토리 공유"}
    </button>
  );
}
