/**
 * 카카오 OAuth 로그인 버튼.
 *
 * 카카오 공식 디자인 가이드를 따른다: 배경 #FEE500, 텍스트 검정 85%.
 * 터치 타깃 44px 이상 유지.
 */
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { signInWithKakao } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface KakaoButtonProps {
  label: string;
  className?: string;
}

/** 카카오 공식 말풍선 로고 (단순화). */
function KakaoLogo() {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M10 0C4.477 0 0 3.582 0 8c0 2.83 1.83 5.31 4.572 6.745L3.21 17.99c-.07.176.137.31.292.193l3.79-2.516c.892.16 1.83.246 2.708.246 5.523 0 10-3.582 10-8S15.523 0 10 0z"
        fill="#000"
      />
    </svg>
  );
}

export function KakaoButton({ label, className }: KakaoButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const t = useTranslations("authButton");

  async function handleClick() {
    setIsPending(true);
    try {
      const { error } = await signInWithKakao();
      if (error) {
        toast.error(t("kakaoFailed", { message: error.message }));
        setIsPending(false);
      }
      // 성공 시 카카오로 리다이렉트되므로 setIsPending(false) 호출 안 함.
    } catch {
      toast.error(t("kakaoStartFailed"));
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 text-sm font-semibold text-black/85 shadow-sm transition-opacity",
        "hover:opacity-90 active:opacity-80",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEE500] focus-visible:ring-offset-2",
        className,
      )}
      aria-label={label}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>{t("redirecting")}</span>
        </>
      ) : (
        <>
          <KakaoLogo />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
