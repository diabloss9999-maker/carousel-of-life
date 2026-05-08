"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { ROUTES } from "@/lib/constants";
import {
  generateFortuneAction,
  type FortuneActionState,
} from "@/app/(dashboard)/today/actions";

interface GenerateFortuneFormProps {
  category: string;
  categoryLabel: string;
}

const initial: FortuneActionState = { kind: "idle" };

export function GenerateFortuneForm({
  category,
  categoryLabel,
}: GenerateFortuneFormProps) {
  const [state, formAction, isPending] = useActionState(
    generateFortuneAction,
    initial,
  );

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          {categoryLabel} 풀이 받기
        </CardTitle>
        <CardDescription>
          당신의 사주를 읽고 오늘의 풀이를 적어드릴게요.
          {isPending ? " 잠시만 기다려주세요…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction}>
          <input type="hidden" name="category" value={category} />
          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                별의 흐름을 읽는 중…
              </>
            ) : (
              "풀이 받기"
            )}
          </Button>
        </form>

        {state.kind === "error" ? (
          <div className="space-y-3">
            <FormMessage
              state={{ kind: "error", message: state.message ?? "" }}
            />
            {state.quotaExceeded ? (
              <Button asChild className="w-full" variant="outline">
                <Link href={ROUTES.pricing}>프리미엄 구독하기</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
