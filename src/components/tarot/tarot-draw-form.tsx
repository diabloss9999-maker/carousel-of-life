"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  drawSingleTarotAction,
  type TarotDrawState,
} from "@/app/(dashboard)/tarot/actions";

const initial: TarotDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;

export function TarotDrawForm() {
  const [state, formAction, isPending] = useActionState(
    drawSingleTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          카드 한 장 뽑기
        </CardTitle>
        <CardDescription>
          질문을 떠올린 채 마음을 가다듬고, 한 장을 뽑아봐.
          {isPending ? " 카드를 섞고 있어요…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="question">
              물어볼 것{" "}
              <span className="text-muted-foreground text-xs">(선택)</span>
            </Label>
            <Input
              id="question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 이번 주 일이 어떻게 흘러갈까? (100자 이내)"
              disabled={isPending}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-muted-foreground">
                비워두면 그냥 오늘의 한 장을 뽑을 수 있어요.
              </p>
              <span
                className={cn(
                  "text-xs tabular-nums shrink-0",
                  charsLeft <= 0
                    ? "text-destructive font-medium"
                    : charsLeft <= 10
                      ? "text-accent"
                      : "text-muted-foreground",
                )}
              >
                {question.length} / {MAX_QUESTION_LENGTH}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                카드를 섞고 있어요…
              </>
            ) : (
              "카드 뽑기"
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
