"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  /** 인스타스토리에 올릴 카드 이미지. 있으면 인스타 메뉴가 활성화된다. */
  imageUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/** X(트위터) 공식 로고. lucide 에 브랜드 아이콘이 없어 인라인 SVG. */
function XIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={props.className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Instagram 카메라/렌즈 아이콘. */
function InstagramIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={props.className}>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * 결과 공유 버튼.
 *
 * 드롭다운 옵션:
 * 1) X(트위터) — 인텐트 URL 로 작성창 자동 열림
 * 2) 인스타그램 — imageUrl 있을 때만. Web Share API(files) 로 시스템 공유 시트 호출 → 인스타 앱 직접 선택.
 *    지원 안 되면 이미지 다운로드 + 캡션 복사 + 인스타 앱/웹으로 이동.
 * 3) 링크 복사
 */
export function ShareButton({
  title,
  text,
  url,
  imageUrl,
  label = "공유하기",
  variant = "outline",
  size = "sm",
  className,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "saved">("idle");
  const ref = useRef<HTMLDivElement>(null);

  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.origin : "https://carouseloflife.com");
  const shareText = `${text}\n\n— 인생의 회전목마\n${shareUrl}`;
  /** X 는 280자 제한 + url 별도 인자라 본문은 짧고 깔끔하게. */
  const xText = `${text.length > 180 ? text.slice(0, 179).trim() + "…" : text}\n\n— 인생의 회전목마`;

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

  async function copyToClipboard(value: string = shareText): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  /** 링크만 복사 */
  async function handleCopyLink() {
    setOpen(false);
    await copyToClipboard();
    setStatus("copied");
    setTimeout(() => setStatus("idle"), 2000);
  }

  /**
   * 시스템 공유 시트 — 모바일이면 카카오톡·메신저·메일 등 모두 노출.
   *
   * 흐름:
   *   1) data-capture-root 가 조상에 있으면 화면 그대로 PNG 캡처
   *   2) 모바일 + Web Share files 지원 → 이미지 첨부 공유 (카카오톡에 그
   *      이미지가 그대로 전송됨 — OG 카드가 아닌 사용자가 본 화면)
   *   3) 미지원/데스크탑 → 기존 URL+텍스트 공유 또는 클립보드 복사
   */
  async function handleSystemShare() {
    setOpen(false);

    // 1) 화면 캡처 시도 (data-capture-root 안에 있을 때만)
    let blob: Blob | null = null;
    try {
      const captureNode = ref.current?.closest<HTMLElement>("[data-capture-root]");
      if (captureNode) {
        const dataUrl = await toPng(captureNode, {
          pixelRatio: 2,
          cacheBust: true,
        });
        blob = await (await fetch(dataUrl)).blob();
      }
    } catch {
      // 캡처 실패 시 URL 공유로 자연 폴백
      blob = null;
    }

    // 2) 모바일 + files 지원 → 이미지 첨부 공유
    if (
      blob &&
      isMobileUA() &&
      typeof navigator !== "undefined" &&
      "canShare" in navigator
    ) {
      const file = new File([blob], "carousel-of-life.png", {
        type: "image/png",
      });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      const shareData: ShareData = {
        files: [file],
        title,
        text: shareText,
      };
      if (nav.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          setStatus("shared");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          // files 공유 실패 시 URL 공유로 폴백
        }
      }
    }

    // 3) 폴백 — URL+텍스트 공유 또는 클립보드 복사
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyToClipboard();
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl,
      });
      setStatus("shared");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await copyToClipboard();
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  /** X(트위터) 인텐트 — 새 창에 작성 화면 열림. url 은 og:image 가 잡힌 share 페이지. */
  function handleXShare() {
    setOpen(false);
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", xText);
    intent.searchParams.set("url", shareUrl);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
    setStatus("shared");
    setTimeout(() => setStatus("idle"), 2000);
  }

  /**
   * 인스타그램으로 연결.
   *
   * 우선순위:
   *  1) Web Share API + files (모바일) — 시스템 공유 시트가 열리고 사용자가 Instagram 을 선택하면
   *     이미지가 첨부된 채로 IG 앱이 열린다 (스토리/피드 게시 준비 완료).
   *  2) 모바일이지만 files 지원 안 됨 — 이미지 다운로드 + 캡션 복사 + `instagram://` 딥링크.
   *  3) 데스크탑 — 이미지 다운로드 + 캡션 복사 + instagram.com 새 창.
   */
  async function handleInstagramShare() {
    setOpen(false);

    // 1) data-capture-root 가 조상에 있으면 화면 그대로 캡처 — 사용자 기대치
    // 2) 없으면 imageUrl 폴백
    let blob: Blob | null = null;
    try {
      const captureNode = ref.current?.closest<HTMLElement>("[data-capture-root]");
      if (captureNode) {
        const dataUrl = await toPng(captureNode, {
          pixelRatio: 2,
          cacheBust: true,
        });
        blob = await (await fetch(dataUrl)).blob();
      } else if (imageUrl) {
        blob = await (await fetch(imageUrl)).blob();
      }
    } catch {
      // 캡처 실패 — 캡션이라도 복사
      await copyToClipboard();
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    if (!blob) {
      await copyToClipboard();
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    const file = new File([blob], "carousel-of-life.png", { type: "image/png" });
    const mobile = isMobileUA();

    // ① 모바일: Web Share API 로 시스템 시트 호출 (인스타 앱이 시트에 직접 노출됨)
    if (mobile && typeof navigator !== "undefined" && "canShare" in navigator) {
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const shareData: ShareData = { files: [file], title, text: shareText };
      if (nav.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          setStatus("shared");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          // 실패 시 ② 단계로 폴백
        }
      }
    }

    // ② / ③ 폴백: 이미지 다운로드 + 캡션 복사
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "carousel-of-life.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);

    await copyToClipboard().catch(() => undefined);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);

    // 모바일이면 인스타 앱(스토리 카메라) 으로, 데스크탑이면 instagram.com 으로 이동
    if (mobile) {
      window.location.href = "instagram://story-camera";
    } else {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
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
        ) : status === "saved" ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" aria-hidden />
            <span>이미지 저장됨</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" aria-hidden />
            <span>{label}</span>
          </>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-60 rounded-xl border border-border/60 bg-white shadow-xl overflow-hidden">
          {/* ① 카카오톡·메신저 — 모바일 시스템 공유 시트 */}
          <button
            type="button"
            onClick={handleSystemShare}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors border-b border-border/40"
          >
            <MessageCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-[15px]">카카오톡·메신저로 공유</p>
              <p className="text-[15px] text-muted-foreground mt-0.5">화면 그대로 이미지로 보내요</p>
            </div>
          </button>

          {/* ② X(트위터) */}
          <button
            type="button"
            onClick={handleXShare}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors border-b border-border/40"
          >
            <XIcon className="h-4 w-4 text-foreground flex-shrink-0" />
            <div>
              <p className="font-medium text-[15px]">X(트위터)에 공유</p>
              <p className="text-[15px] text-muted-foreground mt-0.5">작성창이 자동으로 열려요</p>
            </div>
          </button>

          {/* ② 인스타그램 — imageUrl 있을 때만 노출 */}
          {imageUrl && (
            <button
              type="button"
              onClick={handleInstagramShare}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors border-b border-border/40"
            >
              <InstagramIcon className="h-4 w-4 text-pink-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-[15px]">인스타그램에 공유</p>
                <p className="text-[15px] text-muted-foreground mt-0.5">인스타 앱이 자동으로 열려요</p>
              </div>
            </button>
          )}

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
