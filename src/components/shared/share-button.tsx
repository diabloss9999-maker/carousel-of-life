"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";

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

const KAKAO_OPENCHAT_URL = "https://invite.kakao.com/tc/W5meqEedOZ";

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
   * 인스타그램은 외부 사이트에서 직접 게시를 못 한다.
   * 대신 (1) 1080² 카드 이미지를 갤러리에 저장하고 (2) 캡션을 클립보드에 복사한 뒤
   * 모바일이면 Instagram 앱을 열어 사용자가 스토리/피드에 붙여 넣게 한다.
   */
  async function handleInstagramShare() {
    setOpen(false);
    if (!imageUrl) return;

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "carousel-of-life.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      await navigator.clipboard.writeText(shareText).catch(() => undefined);

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);

      // 모바일이면 인스타 앱 열기 (데스크탑은 무시되니 무해함).
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = "instagram://story-camera";
      }
    } catch {
      // 다운로드 실패 시에라도 캡션은 복사해둔다.
      await copyToClipboard();
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
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

          {/* ③ X(트위터) */}
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

          {/* ④ 인스타그램 — imageUrl 있을 때만 노출 */}
          {imageUrl && (
            <button
              type="button"
              onClick={handleInstagramShare}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-left hover:bg-accent/50 transition-colors border-b border-border/40"
            >
              <InstagramIcon className="h-4 w-4 text-pink-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-[15px]">인스타그램에 공유</p>
                <p className="text-[15px] text-muted-foreground mt-0.5">이미지 저장 + 캡션 복사</p>
              </div>
            </button>
          )}

          {/* ⑤ 링크 복사 */}
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
