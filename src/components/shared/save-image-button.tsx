"use client";

/**
 * 이미지 저장 버튼.
 *
 * 캡처 방식:
 * 1) data-capture-root 가 가까운 DOM 조상에 있으면 → html-to-image 로 그 노드를
 *    실제로 캡처해 PNG 다운로드 (사용자가 화면에서 보는 그대로).
 * 2) 없으면 imageUrl 을 그대로 fetch + 다운로드 (구버전 OG 이미지 폴백).
 */
import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaveImageButtonProps {
  /** 폴백 OG 이미지 URL — DOM 캡처가 불가능할 때 사용. */
  imageUrl?: string;
  filename?: string;
  className?: string;
}

export function SaveImageButton({
  imageUrl,
  filename = "인생의회전목마",
  className,
}: SaveImageButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const btnRef = useRef<HTMLButtonElement>(null);

  async function handleSave() {
    if (status === "loading") return;
    setStatus("loading");

    try {
      const captureNode = btnRef.current?.closest<HTMLElement>("[data-capture-root]");

      let blob: Blob | null = null;

      if (captureNode) {
        // 캡처 모드 클래스 토글 — 흰색 배경 + 어두운 텍스트로 라이트 톤 전환
        captureNode.classList.add("is-capturing");
        try {
          const dataUrl = await toPng(captureNode, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: "#ffffff",
          });
          const res = await fetch(dataUrl);
          blob = await res.blob();
        } finally {
          captureNode.classList.remove("is-capturing");
        }
      } else if (imageUrl) {
        // 폴백: 서버 OG 이미지 다운로드
        const res = await fetch(imageUrl);
        blob = await res.blob();
      }

      if (!blob) {
        setStatus("idle");
        return;
      }

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
      ref={btnRef}
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
