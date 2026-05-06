"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initial: AuthFormState = { kind: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          required
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
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 들어가는
            중…
          </>
        ) : (
          "로그인"
        )}
      </Button>
    </form>
  );
}
