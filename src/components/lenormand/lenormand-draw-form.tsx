"use client";

/**
 * 르노르망 카드 뽑기 폼.
 *
 * - 단일(1장) / 3장 스프레드 선택 가능.
 * - 질문은 선택 입력.
 * - 이미지는 추후 추가 예정 — 지금은 플레이스홀더.
 */
import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  drawLenormandAction,
  type LenormandDrawState,
} from "@/app/(dashboard)/tarot/actions";
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
import { Select } from "@/components/ui/select";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initial: LenormandDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;

export function LenormandDrawForm() {
  const [state, formAction, isPending] = useActionState(
    drawLenormandAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "lenormand-results");

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          르노르망 카드
        </CardTitle>
        <CardDescription>
          36장의 르노르망 카드로 구체적인 메시지를 받아봐.
          {isPending ? " 카드를 고르는 중…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 카드 플레이스홀더 — 이미지 추가 시 교체 */}
        <div className="flex justify-center">
          <div
            className={cn(
              "flex aspect-[2/3] w-36 items-center justify-center rounded-xl border-2 border-border/40 bg-gradient-to-br from-amber-950/80 to-stone-950/90 transition-opacity sm:w-44",
              isPending && "opacity-60",
            )}
          >
            <div className="space-y-1 text-center">
              <p className="font-mystic text-4xl text-amber-400/80">✦</p>
              <p className="text-xs text-amber-200/50">Lenormand</p>
            </div>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="len-question">
              질문{" "}
              <span className="text-muted-foreground text-xs">(선택)</span>
            </Label>
            <Input
              id="len-question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 지금 이 선택이 맞을까? (100자 이내)"
              disabled={isPending}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-muted-foreground text-xs">
                비워두면 그냥 한 장을 뽑을 수 있어요.
              </p>
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
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

          <div className="space-y-1.5">
            <Label htmlFor="len-spread">스프레드</Label>
            <Select
              id="len-spread"
              name="spread"
              defaultValue="single"
              disabled={isPending}
            >
              <option value="single">한 장 — 오늘의 메시지</option>
              <option value="three">세 장 — 과거·현재·미래</option>
            </Select>
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
                카드를 고르는 중…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                카드 뽑기
              </>
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
