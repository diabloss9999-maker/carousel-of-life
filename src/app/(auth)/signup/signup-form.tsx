"use client";

import { useState, useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signupAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initial: AuthFormState = { kind: "idle" };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initial);
  const [pwError, setPwError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const pw = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const pw2 = (form.elements.namedItem("passwordConfirm") as HTMLInputElement)?.value;

    if (pw !== pw2) {
      e.preventDefault();
      setPwError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setPwError(null);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">이름</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={40}
          placeholder="주술사가 부를 당신의 이름"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          placeholder="여덟 자 이상"
          disabled={isPending}
          onChange={() => setPwError(null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          placeholder="비밀번호를 한 번 더 입력해줘"
          disabled={isPending}
          onChange={() => setPwError(null)}
        />
      </div>

      {pwError ? (
        <FormMessage state={{ kind: "error", message: pwError }} />
      ) : (
        <FormMessage
          state={
            state.kind === "idle"
              ? { kind: "idle" }
              : state.kind === "error"
                ? { kind: "error", message: state.message ?? "" }
                : { kind: "success", message: state.message ?? "" }
          }
        />
      )}

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 가입 중…
          </>
        ) : (
          "가입하기"
        )}
      </Button>
    </form>
  );
}
