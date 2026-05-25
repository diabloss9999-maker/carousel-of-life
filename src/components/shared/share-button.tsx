"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clientEnv } from "@/lib/env";
import { ensureKakaoInit, shareToKakao } from "@/lib/kakao/share";

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
 * data-capture-root 노드를 PNG 로 캡처. 알파 채널 문제 해결을 위해 캡처 직전
 * is-capturing 클래스 추가로 불투명 다크 배경 강제 적용, 캡처 직후 클래스 제거.
 */
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
   * 카카오톡·메신저 공유 — 화면 캡처 이미지 첨부.
   *
   * 흐름:
   *   1) data-capture-root 에서 화면 PNG 캡처
   *   2) 카카오 SDK 사용 가능 → 이미지 업로드 → Kakao Share API (데스크탑·모바일 모두 자동)
   *   3) 모바일 + Web Share files → 시스템 공유 시트 (카카오톡 외 메신저도 가능)
   *   4) 미지원/데스크탑 → URL 공유 또는 클립보드 복사
   */
  async function handleSystemShare() {
    setOpen(false);

    // 1) 화면 캡처 (불투명 배경 강제 — 인스타·카카오톡에서 어두워지지 않게)
    const captureNode = ref.current?.closest<HTMLElement>("[data-capture-root]");
    const blob = captureNode ? await captureCardAsBlob(captureNode) : null;

    // 2) 카카오 SDK 우선 — 데스크탑·모바일 모두 카카오톡으로 자동 공유
    if (
      blob &&
      clientEnv.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY &&
      ensureKakaoInit()
    ) {
      try {
        const fd = new FormData();
        fd.append("file", new File([blob], "carousel-of-life.png", { type: "image/png" }));
        const uploadRes = await fetch("/api/share/upload-image", {
          method: "POST",
          body: fd,
        });
        const uploadJson: { ok: boolean; data?: { url: string } } =
          await uploadRes.json();
        if (uploadRes.ok && uploadJson.ok && uploadJson.data?.url) {
          const ok = shareToKakao({
            title,
            description: text.slice(0, 200),
            imageUrl: uploadJson.data.url,
            url: shareUrl,
          });
          if (ok) {
            setStatus("shared");
            setTimeout(() => setStatus("idle"), 2000);
            return;
          }
        }
      } catch (e) {
        console.error("[kakao-share-flow]", e);
        // 폴백 진행
      }
    }

    // 3) 모바일 + Web Share files → 시스템 시트 (X·인스타·메일 등 함께 선택 가능)
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
      const shareData: ShareData = { files: [file], title, text: shareText };
      if (nav.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          setStatus("shared");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
        }
      }
    }

    // 4) 폴백 — URL+텍스트 공유 또는 클립보드 복사
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyToClipboard();
      toast.success("링크와 텍스트를 복사했어요.");
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
      setStatus("shared");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await copyToClipboard();
      toast.success("링크와 텍스트를 복사했어요.");
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  /**
   * X(트위터) 공유 — 화면 캡처 이미지가 함께 가도록.
   *
   * 흐름:
   *  1) data-capture-root 에서 PNG 캡처
   *  2) 모바일 + Web Share files 지원 → 시스템 시트 (X 앱이 이미지 첨부된 채로 열림)
   *  3) 데스크탑 또는 미지원
   *     - 클립보드에 이미지 복사 시도 (ClipboardItem)
   *     - 실패 시 이미지 다운로드
   *     - X 인텐트 새 탭 열기 + 토스트 안내
   *
   * X 의 intent URL 자체는 이미지 자동 첨부를 지원하지 않으므로,
   * 사용자가 X 작성창에서 Ctrl+V (또는 첨부 버튼) 해야 한다.
   */
  async function handleXShare() {
    setOpen(false);

    // 1) 화면 캡처 (불투명 배경 강제)
    const captureNode = ref.current?.closest<HTMLElement>("[data-capture-root]");
    const blob = captureNode ? await captureCardAsBlob(captureNode) : null;

    // 2) 모바일 + Web Share files 지원 → 시스템 시트로 X 앱 호출
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
      const shareData: ShareData = { files: [file], title, text: xText };
      if (nav.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          setStatus("shared");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          // 폴백
        }
      }
    }

    // 3) 데스크탑/미지원 — 클립보드에 이미지 복사 시도 → X 인텐트 새 탭
    let imageOnClipboard = false;
    if (blob && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        const ClipboardItemCtor =
          typeof window !== "undefined"
            ? (window as unknown as { ClipboardItem?: typeof ClipboardItem })
                .ClipboardItem
            : undefined;
        if (ClipboardItemCtor) {
          await navigator.clipboard.write([
            new ClipboardItemCtor({ "image/png": blob }),
          ]);
          imageOnClipboard = true;
        }
      } catch {
        imageOnClipboard = false;
      }
    }

    // 클립보드 복사 실패 시 이미지 다운로드로 폴백
    if (!imageOnClipboard && blob) {
      try {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = "carousel-of-life.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* 다운로드 실패도 무시 — 텍스트만 X 인텐트로 */
      }
    }

    // X 인텐트 열기
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", xText);
    intent.searchParams.set("url", shareUrl);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");

    // 안내 토스트
    if (blob) {
      if (imageOnClipboard) {
        toast.success(
          "이미지를 클립보드에 복사했어요. X 작성창에서 Ctrl+V 로 붙여넣어주세요.",
        );
      } else {
        toast.success(
          "이미지를 저장했어요. X 작성창에서 사진 첨부 버튼으로 추가해주세요.",
        );
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("shared");
      setTimeout(() => setStatus("idle"), 2000);
    }
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

    // 1) data-capture-root 가 조상에 있으면 화면 그대로 캡처 (불투명 배경 강제)
    // 2) 없으면 imageUrl 폴백
    const captureNode = ref.current?.closest<HTMLElement>("[data-capture-root]");
    let blob: Blob | null = null;
    if (captureNode) {
      blob = await captureCardAsBlob(captureNode);
    } else if (imageUrl) {
      try {
        blob = await (await fetch(imageUrl)).blob();
      } catch {
        blob = null;
      }
    }

    if (!blob) {
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
        <div className="absolute right-0 bottom-full mb-2 z-50 w-60 rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-xl overflow-hidden backdrop-blur-md">
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
              <p className="text-[15px] text-muted-foreground mt-0.5">화면 그대로 이미지로 보내요</p>
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
