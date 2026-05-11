"use client";

/**
 * 공유 이미지 저장 버튼.
 * API 라우트에서 PNG를 받아 다운로드하거나 Web Share API로 공유한다.
 */
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaveImageButtonProps {
  /** 이미지 생성 API URL (쿼리 파라미터 포함) */
  imageUrl: string;
  /** 저장될 파일명 (확장자 제외) */
  filename?: string;
  className?: string;
}

export function SaveImageButton({
  imageUrl,
  filename = "인생의회전목마",
  className,
}: SaveImageButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSave() {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();

      // Web Share API (iOS Safari, Android Chrome) — 파일 공유
      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator
      ) {
        const file = new File([blob], `${filename}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "인생의 회전목마",
          });
          setStatus("done");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        }
      }

      // 폴백: 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={status === "loading"}
      className={cn("gap-1.5", className)}
    >
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {status === "done" ? "저장됨" : "이미지 저장"}
    </Button>
  );
}
