"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Crown, Loader2 } from "lucide-react";

import {
  drawSevenTarotAction,
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
import { TAROT_DECK } from "@/lib/tarot/cards";
import { cn } from "@/lib/utils";

const initial: TarotDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;
const DRAW_AFTER_ALL_REVEALED_MS = 700;

const POSITIONS = [
  "현재",
  "숨은 감정",
  "장애물",
  "내가 할 일",
  "상대/환경",
  "가까운 흐름",
  "최종 조언",
] as const;

const QUESTION_EXAMPLES = [
  "이 관계를 어떻게 풀어가야 할까?",
  "지금 선택지 중 무엇을 기준으로 봐야 할까?",
  "이번 달 가장 중요한 흐름을 깊게 봐줘",
] as const;

type PreviewCard = {
  id: string;
  nameEn: string;
  isReversed: boolean;
};

interface TarotSevenFormProps {
  tier: "free" | "lite" | "pro";
  reader: TarotReader;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function TarotSevenForm({ tier, reader: _reader }: TarotSevenFormProps) {
  void _reader;
  const [state, formAction, isPending] = useActionState(
    drawSevenTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [revealed, setRevealed] = useState<boolean[]>(
    Array.from({ length: POSITIONS.length }, () => false),
  );
  const [previewCards, setPreviewCards] = useState<(PreviewCard | null)[]>(
    Array.from({ length: POSITIONS.length }, () => null),
  );
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "tarot-results");

  useEffect(() => {
    if (!isPending && submitting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitting(false);
    }
  }, [isPending, submitting]);

  async function handleReveal(index: number) {
    if (tier !== "pro" || isPending || submitting || revealed[index]) return;

    const usedIds = new Set(
      previewCards.flatMap((card) => (card ? [card.id] : [])),
    );
    const availableCards = TAROT_DECK.filter((card) => !usedIds.has(card.id));
    const picked =
      availableCards[Math.floor(Math.random() * availableCards.length)] ??
      TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    const nextPreviewCards = previewCards.map((value, i) =>
      i === index
        ? {
            id: picked.id,
            nameEn: picked.nameEn,
            isReversed: Math.random() < 0.5,
          }
        : value,
    );
    const next = revealed.map((value, i) => (i === index ? true : value));
    setPreviewCards(nextPreviewCards);
    setRevealed(next);

    if (next.every(Boolean)) {
      setSubmitting(true);
      await sleep(DRAW_AFTER_ALL_REVEALED_MS);
      formRef.current?.requestSubmit();
    }
  }

  const isBusy = isPending || submitting;
  const revealedCount = revealed.filter(Boolean).length;

  if (tier !== "pro") {
    return (
      <Card className="app-surface overflow-hidden ring-1 ring-primary/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-primary" aria-hidden />
            7장 프로 전략 타로
          </CardTitle>
          <CardDescription>
            현재, 숨은 감정, 장애물, 행동 기준까지 한 번에 보는 프로 전용
            리포트예요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SevenCardStage
            revealed={Array.from({ length: POSITIONS.length }, () => false)}
            previewCards={Array.from({ length: POSITIONS.length }, () => null)}
            disabled
          />
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-3 text-[14px] leading-6 text-muted-foreground">
            라이트는 3장 흐름까지, 프로는 7장 전략 리포트로 더 깊게
            열어봐요.
          </div>
          <Button asChild className="w-full" size="lg">
            <Link href={ROUTES.pricing}>
              <Crown className="h-4 w-4" aria-hidden />
              프로로 7장 타로 열기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface overflow-hidden ring-1 ring-primary/20">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Crown className="h-5 w-5 text-primary" aria-hidden />
          7장 프로 전략 타로
        </CardTitle>
        <CardDescription>
          왼쪽부터 차례로 열면 현재 흐름부터 최종 조언까지 깊게 정리해요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SevenCardStage
          revealed={revealed}
          previewCards={previewCards}
          disabled={isBusy}
          onReveal={handleReveal}
        />

        <div className="min-h-6 text-center text-[14px] font-medium text-muted-foreground">
          {isPending || submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              7장 흐름을 깊게 읽는 중
            </span>
          ) : revealedCount === 0 ? (
            "현재 카드부터 차례로 눌러보세요."
          ) : revealedCount < POSITIONS.length ? (
            `${revealedCount} / ${POSITIONS.length}장 열렸어요. 남은 카드를 눌러주세요.`
          ) : (
            "일곱 장이 모두 열렸어요."
          )}
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          {previewCards.map((card, index) =>
            card ? (
              <span key={`${card.id}-${index}`}>
                <input type="hidden" name="cardId" value={card.id} />
                <input
                  type="hidden"
                  name="cardReversed"
                  value={card.isReversed ? "true" : "false"}
                />
              </span>
            ) : null,
          )}
          <div className="space-y-1.5">
            <Label htmlFor="seven-question">질문</Label>
            <Input
              id="seven-question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="깊게 보고 싶은 관계, 선택, 흐름을 적어주세요"
              disabled={isBusy}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[15px] text-muted-foreground">
                비워두면 지금 가장 중요한 흐름을 기준으로 읽어요.
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
          <FormMessage
            state={{
              kind: "error",
              message: state.message ?? "7장 타로를 불러오지 못했어요.",
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function SevenCardStage({
  revealed,
  previewCards,
  disabled = false,
  onReveal,
}: {
  revealed: boolean[];
  previewCards: (PreviewCard | null)[];
  disabled?: boolean;
  onReveal?: (index: number) => void;
}) {
  return (
    <div className="tarot-open-stage tarot-seven-open-stage">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {POSITIONS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "space-y-1.5 text-center",
              index === POSITIONS.length - 1 && "col-span-4 justify-self-center",
            )}
          >
            <button
              type="button"
              onClick={() => onReveal?.(index)}
              disabled={disabled || !onReveal || revealed[index]}
              aria-label={`${label} 카드 뒤집기`}
              className={cn(
                "tarot-flip-card tarot-seven-flip-card",
                revealed[index] && "is-flipped",
                disabled && "is-busy",
              )}
            >
              <span className="tarot-flip-card__inner">
                <span className="tarot-flip-card__face tarot-flip-card__back">
                  <Image
                    src="/tarot/card_back.webp"
                    alt=""
                    fill
                    sizes="92px"
                    className="object-contain"
                  />
                </span>
                <span
                  className={cn(
                    "tarot-flip-card__face tarot-flip-card__front",
                    previewCards[index] && "tarot-flip-card__front--image",
                  )}
                >
                  {previewCards[index] ? (
                    <Image
                      src={`/tarot/${previewCards[index].id}.webp`}
                      alt={previewCards[index].nameEn}
                      fill
                      sizes="92px"
                      className={cn(
                        "object-cover",
                        previewCards[index].isReversed && "rotate-180",
                      )}
                    />
                  ) : (
                    <span
                      className="tarot-front-orb tarot-front-orb--small"
                      aria-hidden
                    />
                  )}
                </span>
              </span>
            </button>
            <p className="text-[11px] font-bold leading-tight text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
