"use client";

/**
 * 이미지 저장 버튼 — 공유 다이얼로그 없이 바로 다운로드.
 */
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaveImageButtonProps {
  imageUrl: string;
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

      // 항상 직접 다운로드 (공유 다이얼로그 없음)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
