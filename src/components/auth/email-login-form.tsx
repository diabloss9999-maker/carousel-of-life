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
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
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
  const t = useTranslations("emailLoginForm");
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
      toast.error(t("missingFields"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }

    startTransition(async () => {
      track("auth_submit", { mode: isSignUp ? "sign_up" : "sign_in" });
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
          track("auth_error", { mode: "sign_up" });
          toast.error(error.message);
          return;
        }
        // Supabase 가 email 확인을 끄면 바로 세션 발급, 켜져 있으면 메일 발송.
        if (data.session) {
          track("auth_success", { mode: "sign_up" });
          toast.success(t("signupComplete"));
          const ref = params.get("ref");
          const url = ref
            ? (`${ROUTES.onboarding}?ref=${encodeURIComponent(ref)}` as Route)
            : (ROUTES.onboarding as Route);
          router.replace(url);
        } else {
          track("auth_email_confirmation_sent");
          toast.success(t("confirmationSent"));
        }
        return;
      }

      // signIn
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        track("auth_error", { mode: "sign_in" });
        toast.error(error.message);
        return;
      }
      track("auth_success", { mode: "sign_in" });
      toast.success(t("loginComplete"));
      const redirectTo = params.get("redirect");
      router.replace(
        redirectTo?.startsWith("/")
          ? (redirectTo as Route)
          : (ROUTES.appHome as Route),
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <label className="block">
        <span className="sr-only">{t("email")}</span>
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
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-[15px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </label>

      <label className="block">
        <span className="sr-only">{t("password")}</span>
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
            placeholder={isSignUp ? t("passwordSignup") : t("password")}
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
            {t("processing")}
          </>
        ) : isSignUp ? (
          t("signupWithEmail")
        ) : (
          t("loginWithEmail")
        )}
      </Button>

      <div className="pt-1 text-center text-[15px] text-muted-foreground">
        {isSignUp ? t("alreadyAccount") : t("noAccount")}{" "}
        <button
          type="button"
          onClick={() => setMode(isSignUp ? "signIn" : "signUp")}
          className="underline-offset-2 hover:underline text-foreground"
        >
          {isSignUp ? t("login") : t("signup")}
        </button>
      </div>
    </form>
  );
}
