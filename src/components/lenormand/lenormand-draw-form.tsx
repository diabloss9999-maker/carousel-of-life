"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";

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
const FAN_CARD_COUNT = 5;
const SELECTED_CARD_INDEX = 2;
const SHUFFLE_DURATION_MS = 1050;
const RISE_DURATION_MS = 450;

type SpreadValue = "single" | "three" | "nine" | "grand_tableau";
type AnimPhase = "idle" | "shuffling" | "selected" | "pending";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Props {
  subscribed: boolean;
}

export function LenormandDrawForm({ subscribed }: Props) {
  const [state, formAction, isPending] = useActionState(
    drawLenormandAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<SpreadValue>("single");
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "lenormand-results");

  const isPremiumSpread = spread === "nine" || spread === "grand_tableau";
  const blockedByPremium = isPremiumSpread && !subscribed;

  // 서버 응답 도착 시 phase 를 idle 로 리셋 — state machine 동기화 패턴.
  useEffect(() => {
    if (!isPending && phase === "pending") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("idle");
    }
  }, [isPending, phase]);

  async function handleDraw() {
    if (phase !== "idle" || isPending || blockedByPremium) return;
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
      case "shuffling": return "섞는 중...";
      case "selected":  return "선택됨";
      case "pending":   return "카드를 고르는 중...";
      default: return isPending ? "카드를 고르는 중..." : "카드 뽑기";
    }
  })();

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          르노르망 카드
        </CardTitle>
        <CardDescription>
          36장의 르노르망 카드로 구체적인 메시지를 받아봐.
          {phase === "shuffling" ? " 카드를 섞고 있어요…" : ""}
          {phase === "pending" || isPending ? " 카드를 고르는 중…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 부채꼴 카드 5장 */}
        <div className="relative mx-auto h-[140px] sm:h-[150px] w-full max-w-md">
          {Array.from({ length: FAN_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "tarot-card-fan w-[72px] sm:w-[80px]",
                phase === "shuffling" && "shuffling",
                (phase === "selected" || phase === "pending") && i === SELECTED_CARD_INDEX && "selected",
              )}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <Image
                src="/collection/card_back_lenormand.png"
                alt="르노르망 카드 뒷면"
                width={144}
                height={216}
                className="w-full rounded-xl"
                priority={i === SELECTED_CARD_INDEX}
              />
            </div>
          ))}
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
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
              disabled={isBusy}
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
              value={spread}
              onChange={(e) => setSpread(e.target.value as SpreadValue)}
              disabled={isBusy}
            >
              <option value="single">한 장 — 오늘의 메시지</option>
              <option value="three">세 장 — 과거·현재·미래</option>
              <option value="nine">아홉 장 — 3×3 종합 스프레드 (라이트)</option>
              <option value="grand_tableau">그랑 타블로 — 36장 전체 (라이트)</option>
            </Select>
          </div>

          {spread === "grand_tableau" ? (
            <div className="space-y-2">
              <Label>성별 (시그니피케이터)</Label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    defaultChecked
                    disabled={isBusy || blockedByPremium}
                    className="accent-accent"
                  />
                  <span className="text-sm">남성 (신사 카드)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    disabled={isBusy || blockedByPremium}
                    className="accent-accent"
                  />
                  <span className="text-sm">여성 (숙녀 카드)</span>
                </label>
              </div>
              <p className="text-muted-foreground text-xs">
                질문자 본인을 상징할 카드를 골라요. 28번 신사 또는 29번 숙녀
                카드를 기준점으로 삼습니다.
              </p>
            </div>
          ) : null}

          {blockedByPremium ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-50/5 p-3">
              <p className="text-xs leading-relaxed text-amber-300/90">
                <Lock className="mr-1 inline-block h-3.5 w-3.5" aria-hidden />
                이 스프레드는 라이트 구독자 전용이에요.
              </p>
              <Button asChild className="mt-2 w-full" variant="outline" size="sm">
                <Link href={ROUTES.pricing}>라이트 구독하기</Link>
              </Button>
            </div>
          ) : null}

          <Button
            type="button"
            onClick={handleDraw}
            disabled={isBusy || blockedByPremium}
            size="lg"
            className="w-full"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {buttonLabel}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                {buttonLabel}
              </>
            )}
          </Button>
        </form>

        {state.kind === "error" ? (
          <div className="space-y-3">
            <FormMessage
              state={{ kind: "error", message: state.message ?? "" }}
            />
            {state.quotaExceeded || state.premiumOnly ? (
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
