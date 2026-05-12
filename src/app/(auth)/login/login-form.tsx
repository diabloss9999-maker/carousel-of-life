"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginAction,
  type AuthFormState,
} from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/** localStorage 키 상수. */
const LS_EMAIL = "carousel:remembered-email";
const LS_REMEMBER = "carousel:remember-email";

const initial: AuthFormState = { kind: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  /** 이메일 기억하기 체크박스 상태. */
  const [rememberEmail, setRememberEmail] = useState(false);
  /** 자동 로그인(세션 유지) 체크박스 상태. */
  const [autoLogin, setAutoLogin] = useState(true);

  const emailRef = useRef<HTMLInputElement>(null);

  /** 마운트 시 localStorage 에 저장된 이메일·설정을 복원한다. */
  useEffect(() => {
    const savedEmail = localStorage.getItem(LS_EMAIL);
    const savedRemember = localStorage.getItem(LS_REMEMBER) === "true";
    if (savedRemember && savedEmail && emailRef.current) {
      emailRef.current.value = savedEmail;
      setRememberEmail(true);
    }
  }, []);

  /**
   * 폼 제출 직전에 localStorage 에 이메일을 저장하거나 삭제한다.
   * form action 은 preventDefault() 없이 정상 실행된다.
   */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    )?.value ?? "";

    if (rememberEmail && email) {
      localStorage.setItem(LS_EMAIL, email);
      localStorage.setItem(LS_REMEMBER, "true");
    } else {
      localStorage.removeItem(LS_EMAIL);
      localStorage.removeItem(LS_REMEMBER);
    }
    // e.preventDefault() 하지 않음 → form action 이 정상 실행됨.
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {/* autoLogin 값을 hidden field 로 서버 액션에 전달. */}
      <input type="hidden" name="autoLogin" value={autoLogin ? "true" : "false"} />

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="여덟 자 이상"
          disabled={isPending}
        />
      </div>

      {/* 아이디 기억하기 / 자동 로그인 */}
      <div className="flex flex-col gap-2 pt-1">
        <CheckOption
          id="remember-email"
          checked={rememberEmail}
          onChange={setRememberEmail}
          label="이메일 기억하기"
        />
        <CheckOption
          id="auto-login"
          checked={autoLogin}
          onChange={setAutoLogin}
          label="로그인 상태 유지"
          description="해제하면 브라우저를 닫을 때 로그아웃돼"
        />
      </div>

      <FormMessage
        state={
          state.kind === "idle"
            ? { kind: "idle" }
            : state.kind === "error"
              ? { kind: "error", message: state.message ?? "" }
              : { kind: "success", message: state.message ?? "" }
        }
      />

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 들어가는
            중…
          </>
        ) : (
          "관측 시작"
        )}
      </Button>
    </form>
  );
}

/** 작은 체크박스 + 레이블 컴포넌트. */
function CheckOption({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 select-none"
    >
      {/* 커스텀 체크박스 */}
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            "h-4 w-4 rounded border transition-colors",
            checked
              ? "border-primary bg-primary"
              : "border-border bg-transparent",
          )}
          aria-hidden
        >
          {checked && (
            <svg
              viewBox="0 0 12 12"
              fill="none"
              className="h-full w-full p-0.5 text-primary-foreground"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="space-y-0.5">
        <span className="text-sm text-foreground/90">{label}</span>
        {description && !checked ? (
          <p className="text-xs text-muted-foreground/70">{description}</p>
        ) : null}
      </div>
    </label>
  );
}
