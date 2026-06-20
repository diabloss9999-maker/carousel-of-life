"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

function XIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={props.className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={props.className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

async function captureCardAsBlob(
  captureNode: HTMLElement,
): Promise<Blob | null> {
  captureNode.classList.add("is-capturing");
  try {
    const dataUrl = await toPng(captureNode, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    return await (await fetch(dataUrl)).blob();
  } catch {
    return null;
  } finally {
    captureNode.classList.remove("is-capturing");
  }
}

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
    url ?? (typeof window !== "undefined" ? window.location.href : "https://carouseloflife.com");
  const shareText = `${text}\n\n인생의 회전목마\n${shareUrl}`;
  const shortText = `${text.length > 180 ? `${text.slice(0, 179).trim()}...` : text}\n\n인생의 회전목마`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function getShareBlob(): Promise<Blob | null> {
    const captureNode = ref.current?.closest<HTMLElement>("[data-capture-root]");
    if (captureNode) return captureCardAsBlob(captureNode);
    if (!imageUrl) return null;
    try {
      return await (await fetch(imageUrl)).blob();
    } catch {
      return null;
    }
  }

  async function copyToClipboard(value: string = shareText): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  function resetStatus(delay = 2000) {
    window.setTimeout(() => setStatus("idle"), delay);
  }

  async function handleCopyLink() {
    setOpen(false);
    await copyToClipboard();
    setStatus("copied");
    toast.success("링크를 복사했어요.");
    resetStatus();
  }

  async function handleSystemShare() {
    setOpen(false);
    const blob = await getShareBlob();

    if (blob && isMobileUA() && "canShare" in navigator) {
      const file = new File([blob], "carousel-of-life.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      const data: ShareData = { files: [file], title, text: shareText };
      if (nav.canShare?.(data)) {
        try {
          await navigator.share(data);
          setStatus("shared");
          resetStatus();
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
        }
      }
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        setStatus("shared");
        resetStatus();
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }

    await copyToClipboard();
    setStatus("copied");
    toast.success("공유 문구를 복사했어요.");
    resetStatus();
  }

  async function handleXShare() {
    setOpen(false);
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", shortText);
    intent.searchParams.set("url", shareUrl);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
    setStatus("shared");
    resetStatus();
  }

  async function handleInstagramShare() {
    setOpen(false);
    const blob = await getShareBlob();
    await copyToClipboard();

    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "carousel-of-life.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("이미지를 저장하고 캡션을 복사했어요.");
    } else {
      toast.success("캡션을 복사했어요.");
    }

    if (isMobileUA()) {
      window.location.href = "instagram://story-camera";
      window.setTimeout(() => {
        window.location.href = "https://www.instagram.com/";
      }, 900);
    } else {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }

    setStatus("saved");
    resetStatus(3000);
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
            <span>준비됨</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" aria-hidden />
            <span>{label}</span>
          </>
        )}
      </Button>

      {open ? (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-60 overflow-hidden rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-xl backdrop-blur-md">
          <ShareMenuButton
            icon={<MessageCircle className="h-4 w-4 text-yellow-500" aria-hidden />}
            title="공유하기"
            body="카카오톡, 메시지, 다른 앱으로 보내기"
            onClick={handleSystemShare}
          />
          <ShareMenuButton
            icon={<XIcon className="h-4 w-4 text-foreground" />}
            title="X에 공유"
            body="짧은 문구와 링크로 올리기"
            onClick={handleXShare}
          />
          <ShareMenuButton
            icon={<InstagramIcon className="h-4 w-4 text-pink-400" />}
            title="인스타그램"
            body="이미지 저장 후 스토리로 이동"
            onClick={handleInstagramShare}
          />
          <ShareMenuButton
            icon={<Copy className="h-4 w-4 text-muted-foreground" aria-hidden />}
            title="링크 복사"
            body="문구와 링크를 복사하기"
            onClick={handleCopyLink}
            last
          />
        </div>
      ) : null}
    </div>
  );
}

function ShareMenuButton({
  body,
  icon,
  last = false,
  onClick,
  title,
}: {
  body: string;
  icon: ReactNode;
  last?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-3 text-left text-[15px] transition-colors hover:bg-accent/50",
        !last && "border-b border-border/40",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground">
          {body}
        </span>
      </span>
    </button>
  );
}
