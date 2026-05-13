"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
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

const FAN_CARD_COUNT = 5;
const SELECTED_CARD_INDEX = 2;
const SHUFFLE_DURATION_MS = 1050;
const RISE_DURATION_MS = 450;

type AnimPhase = "idle" | "shuffling" | "selected" | "pending";

/**
 * 비동기 대기 헬퍼.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function TarotDrawForm() {
  const [state, formAction, isPending] = useActionState(
    drawSingleTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "tarot-results");

  // 서버 응답 도착 시 phase를 idle로 리셋
  useEffect(() => {
    if (!isPending && phase === "pending") {
      setPhase("idle");
    }
  }, [isPending, phase]);

  /**
   * 버튼 클릭 핸들러 — 셔플 → 선택 → form submit 순으로 진행한다.
   */
  async function handleDraw() {
    if (phase !== "idle" || isPending) return;
    setPhase("shuffling");
    await sleep(SHUFFLE_DURATION_MS);
    setPhase("selected");
    await sleep(RISE_DURATION_MS);
    setPhase("pending");
    formRef.current?.requestSubmit();
  }

  const isBusy = phase !== "idle" || isPending;

  const buttonLabel = (() => {
    switch (phase) {
      case "shuffling":
        return "섞는 중...";
      case "selected":
        return "선택됨";
      case "pending":
        return "운명을 읽는 중...";
      default:
        return isPending ? "운명을 읽는 중..." : "카드 뽑기";
    }
  })();

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          카드 한 장 뽑기
        </CardTitle>
        <CardDescription>
          질문을 떠올린 채 마음을 가다듬고, 한 장을 뽑아봐.
          {phase === "shuffling" ? " 카드를 섞고 있어요…" : ""}
          {phase === "pending" || isPending ? " 운명을 읽는 중…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 부채꼴로 펼쳐진 카드 5장 */}
        <div className="relative mx-auto h-[140px] sm:h-[150px] w-full max-w-md">
          {Array.from({ length: FAN_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "tarot-card-fan w-[72px] sm:w-[80px]",
                phase === "shuffling" && "shuffling",
                phase === "selected" && i === SELECTED_CARD_INDEX && "selected",
                phase === "pending" && i === SELECTED_CARD_INDEX && "selected",
              )}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <Image
                src="/tarot/card_back.png"
                alt="타로 카드 뒷면"
                width={144}
                height={216}
                className="w-full"
                priority={i === SELECTED_CARD_INDEX}
              />
            </div>
          ))}
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="question">
              질문{" "}
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
              disabled={isBusy}
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
            type="button"
            onClick={handleDraw}
            disabled={isBusy}
            size="lg"
            className="w-full"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {buttonLabel}
              </>
            ) : (
              buttonLabel
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
                <Link href={ROUTES.pricing}>라이트 구독하기</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
