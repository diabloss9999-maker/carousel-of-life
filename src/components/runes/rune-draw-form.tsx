"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";

import {
  drawRuneAction,
  type RuneDrawState,
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

const initial: RuneDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;
const FAN_CARD_COUNT = 5;
const SELECTED_CARD_INDEX = 2;
const SHUFFLE_DURATION_MS = 1050;
const RISE_DURATION_MS = 450;

type SpreadValue = "single" | "three" | "five" | "nine";
type AnimPhase = "idle" | "shuffling" | "selected" | "pending";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Props {
  subscribed: boolean;
}

export function RuneDrawForm({ subscribed }: Props) {
  const [state, formAction, isPending] = useActionState(
    drawRuneAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<SpreadValue>("single");
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "rune-results");

  const isPremiumSpread = spread === "five" || spread === "nine";
  const blockedByPremium = isPremiumSpread && !subscribed;

  useEffect(() => {
    if (!isPending && phase === "pending") {
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
      case "shuffling": return "흔드는 중...";
      case "selected":  return "선택됨";
      case "pending":   return "룬을 읽는 중...";
      default: return isPending ? "룬을 읽는 중..." : "룬 던지기";
    }
  })();

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          엘더 푸타르크 룬
        </CardTitle>
        <CardDescription>
          24개의 고대 룬 중에서 운명의 돌을 던져봐.
          {phase === "shuffling" ? " 룬을 흔들고 있어요…" : ""}
          {phase === "pending" || isPending ? " 룬을 읽는 중…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 부채꼴 카드 5장 */}
        <div className="relative mx-auto h-[220px] w-full max-w-md">
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
                src="/collection/card_back_runes.png"
                alt="룬 카드 뒷면"
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
            <Label htmlFor="rune-question">
              질문{" "}
              <span className="text-muted-foreground text-xs">(선택)</span>
            </Label>
            <Input
              id="rune-question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 지금 이 일을 밀고 나가도 괜찮을까? (100자 이내)"
              disabled={isBusy}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-muted-foreground text-xs">
                비워두면 오늘의 전반적 흐름을 봅니다.
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
            <Label htmlFor="rune-spread">스프레드</Label>
            <Select
              id="rune-spread"
              name="spread"
              value={spread}
              onChange={(e) => setSpread(e.target.value as SpreadValue)}
              disabled={isBusy}
            >
              <option value="single">한 개 — 오늘의 룬</option>
              <option value="three">세 개 — 노른스 (과거·현재·미래)</option>
              <option value="five">다섯 개 — 십자형 스프레드 (프리미엄)</option>
              <option value="nine">아홉 개 — 3×3 종합 스프레드 (프리미엄)</option>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2">
            <input
              type="checkbox"
              id="reversed-toggle"
              name="reversedEnabled"
              defaultChecked
              disabled={isBusy}
              className="h-4 w-4 accent-accent"
            />
            <Label
              htmlFor="reversed-toggle"
              className="cursor-pointer text-sm font-normal"
            >
              역방향(머크스타브) 사용
            </Label>
            <span className="ml-auto text-[10px] text-muted-foreground">
              불변룬 9개는 항상 정방향
            </span>
          </div>

          {blockedByPremium ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-50/5 p-3">
              <p className="text-xs leading-relaxed text-amber-300/90">
                <Lock className="mr-1 inline-block h-3.5 w-3.5" aria-hidden />
                이 스프레드는 프리미엄 구독자 전용이에요.
              </p>
              <Button asChild className="mt-2 w-full" variant="outline" size="sm">
                <Link href={ROUTES.pricing}>프리미엄 구독하기</Link>
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
                <Link href={ROUTES.pricing}>프리미엄 구독하기</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
