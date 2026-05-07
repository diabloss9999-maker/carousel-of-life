"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";

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
  drawThreeTarotAction,
  type TarotDrawState,
} from "@/app/(dashboard)/tarot/actions";

const initial: TarotDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;

interface TarotThreeFormProps {
  /** 활성 구독자 여부. false 면 자물쇠 + 결제 CTA. */
  subscribed: boolean;
}

export function TarotThreeForm({ subscribed }: TarotThreeFormProps) {
  const [state, formAction, isPending] = useActionState(
    drawThreeTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  if (!subscribed) {
    return (
      <Card className="border-accent/30 bg-card/60 backdrop-blur ring-1 ring-accent/15">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-accent" aria-hidden />
            과거-현재-미래 (프리미엄)
          </CardTitle>
          <CardDescription>
            세 장의 카드가 들려주는 흐름의 이야기. 한 장의 풀이보다 훨씬 깊게.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>· 과거 · 지금까지의 결</li>
            <li>· 현재 · 머무는 자리</li>
            <li>· 미래 · 다가올 흐름</li>
            <li>· 세 장을 묶는 종합 풀이</li>
          </ul>
          <Button asChild className="w-full" size="lg">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-4 w-4" aria-hidden />
              프리미엄으로 풀어보기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-card/60 backdrop-blur ring-1 ring-accent/15">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          과거-현재-미래 (3장)
        </CardTitle>
        <CardDescription>
          마음을 가라앉히고 흐름을 묻는 한 가지 질문을 떠올려봐.
          {isPending ? " 카드를 섞고 있어요…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="three-question">
              물어볼 것{" "}
              <span className="text-muted-foreground text-xs">(선택)</span>
            </Label>
            <Input
              id="three-question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 이 일은 어떻게 흘러갈까? (100자 이내)"
              disabled={isPending}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-muted-foreground">
                비워두고 그냥 흐름만 살펴봐도 OK.
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
                세 장의 흐름을 읽는 중…
              </>
            ) : (
              "3장 뽑기"
            )}
          </Button>
        </form>

        {state.kind === "error" ? (
          <div className="space-y-3 mt-4">
            <FormMessage
              state={{
                kind: "error",
                message: state.message ?? "오류가 났어",
              }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
