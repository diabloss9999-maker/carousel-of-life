"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="space-y-4">
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
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 가입하는
            중…
          </>
        ) : (
          "가입하기"
        )}
      </Button>
    </form>
  );
}
