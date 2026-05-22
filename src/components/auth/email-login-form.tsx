"use client";

/**
 * 이메일 + 비밀번호 로그인·회원가입 폼.
 *
 * 두 모드 토글 (로그인 / 회원가입):
 *   - 로그인: signInWithPassword → /auth/callback or /today
 *   - 회원가입: signUp → 이메일 확인 발송 (Supabase 기본). 확인 통과 후 로그인.
 *
 * 카드사 사전심사용 테스트 계정 로그인 채널이기도 함.
 */
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Mode = "signIn" | "signUp";

interface EmailLoginFormProps {
  className?: string;
}

export function EmailLoginForm({ className }: EmailLoginFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const isSignUp = mode === "signUp";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }
    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 해요.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${ROUTES.authCallback}`,
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        // Supabase 가 email 확인을 끄면 바로 세션 발급, 켜져 있으면 메일 발송.
        if (data.session) {
          toast.success("가입 완료. 잠시만요…");
          const ref = params.get("ref");
          const url = ref
            ? `${ROUTES.onboarding}?ref=${ref}`
            : ROUTES.onboarding;
          router.replace(url);
        } else {
          toast.success(
            "확인 메일을 보냈어요. 메일함에서 링크를 눌러 가입을 완료해 주세요.",
          );
        }
        return;
      }

      // signIn
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("로그인 되었어요");
      router.replace(ROUTES.today);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <label className="block">
        <span className="sr-only">이메일</span>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-[15px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </label>

      <label className="block">
        <span className="sr-only">비밀번호</span>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder={isSignUp ? "비밀번호 (8자 이상)" : "비밀번호"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-[15px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </label>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            처리 중…
          </>
        ) : isSignUp ? (
          "이메일로 회원가입"
        ) : (
          "이메일로 로그인"
        )}
      </Button>

      <div className="pt-1 text-center text-[15px] text-muted-foreground">
        {isSignUp ? "이미 가입했나요? " : "계정이 없나요? "}
        <button
          type="button"
          onClick={() => setMode(isSignUp ? "signIn" : "signUp")}
          className="underline-offset-2 hover:underline text-foreground"
        >
          {isSignUp ? "로그인" : "회원가입"}
        </button>
      </div>
    </form>
  );
}
