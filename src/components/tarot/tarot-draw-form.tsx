"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  drawSingleTarotAction,
  type TarotDrawState,
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
import type { TarotReader } from "@/components/tarot/reader";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initial: TarotDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;
const FLIP_TO_DRAW_MS = 780;

const QUESTION_EXAMPLES = [
  "이번 주 흐름이 어떻게 흘러갈까?",
  "지금 이 선택을 해도 괜찮을까?",
  "오늘 내가 놓치지 말아야 할 건?",
] as const;

type AnimPhase = "idle" | "flipped" | "pending";

interface TarotDrawFormProps {
  reader: TarotReader;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function TarotDrawForm(_props: TarotDrawFormProps) {
  void _props;
  const [state, formAction, isPending] = useActionState(
    drawSingleTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "tarot-results");

  useEffect(() => {
    if (!isPending && phase === "pending") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("idle");
    }
  }, [isPending, phase]);

  async function handleDraw() {
    if (phase !== "idle" || isPending) return;
    setPhase("flipped");
    await sleep(FLIP_TO_DRAW_MS);
    setPhase("pending");
    formRef.current?.requestSubmit();
  }

  const isBusy = phase !== "idle" || isPending;
  const isFlipped = phase === "flipped" || phase === "pending" || isPending;

  return (
    <Card className="app-surface overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          한 장 타로
        </CardTitle>
        <CardDescription>
          질문을 떠올리고 가운데 카드를 눌러 뒤집어보세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="tarot-open-stage">
          <button
            type="button"
            onClick={handleDraw}
            disabled={isBusy}
            aria-label="타로 카드 한 장 뒤집기"
            className={cn(
              "tarot-flip-card tarot-single-flip-card",
              isFlipped && "is-flipped",
              isBusy && "is-busy",
            )}
          >
            <span className="tarot-flip-card__inner">
              <span className="tarot-flip-card__face tarot-flip-card__back">
                <Image
                  src="/tarot/card_back.webp"
                  alt="타로 카드 뒷면"
                  fill
                  sizes="180px"
                  className="object-cover"
                  priority
                />
              </span>
              <span className="tarot-flip-card__face tarot-flip-card__front">
                <span className="font-mystic text-sm font-semibold">Tarot</span>
                <span className="text-[11px] leading-4 opacity-70">
                  흐름을 읽는 중
                </span>
              </span>
            </span>
          </button>

          <div className="min-h-6 text-center text-[14px] font-medium text-muted-foreground">
            {isPending || phase === "pending" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                카드를 읽는 중
              </span>
            ) : phase === "flipped" ? (
              "카드가 열렸어요. 해석을 불러오는 중..."
            ) : (
              "카드를 눌러 오늘의 힌트를 확인해보세요."
            )}
          </div>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="question">질문</Label>
            <Input
              id="question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="질문을 적어도 좋고 비워둬도 괜찮아요"
              disabled={isBusy}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[15px] text-muted-foreground">
                비워두면 오늘의 흐름만 가볍게 볼게요.
              </p>
              <span
                className={cn(
                  "shrink-0 text-[15px] tabular-nums",
                  charsLeft <= 0
                    ? "font-medium text-destructive"
                    : charsLeft <= 10
                      ? "text-accent"
                      : "text-muted-foreground",
                )}
              >
                {question.length} / {MAX_QUESTION_LENGTH}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {QUESTION_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(example)}
                  disabled={isBusy}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-left text-[12px] leading-5 text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </form>

        {state.kind === "error" ? (
          <div className="space-y-3">
            <FormMessage
              state={{ kind: "error", message: state.message ?? "" }}
            />
            {state.quotaExceeded ? (
              <Button asChild className="w-full" variant="outline">
                <Link href={ROUTES.pricing}>구독 보기</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
