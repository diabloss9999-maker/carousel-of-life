"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";

import {
  drawThreeTarotAction,
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
const DRAW_AFTER_ALL_REVEALED_MS = 650;

const THREE_QUESTION_EXAMPLES = [
  "이 선택을 하면 흐름이 어떻게 바뀔까?",
  "과거, 현재, 다음 행동을 정리해줘",
  "이 관계의 다음 방향은?",
] as const;

const POSITIONS = [
  { key: "past", label: "과거", sub: "지나온 흐름" },
  { key: "present", label: "현재", sub: "지금의 자리" },
  { key: "future", label: "미래", sub: "다가올 방향" },
] as const;

type PreviewCard = {
  id: string;
  nameEn: string;
  isReversed: boolean;
};

interface TarotThreeFormProps {
  subscribed: boolean;
  reader: TarotReader;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function TarotThreeForm({
  subscribed,
  reader: _reader,
}: TarotThreeFormProps) {
  void _reader;
  const [state, formAction, isPending] = useActionState(
    drawThreeTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [previewCards, setPreviewCards] = useState<(PreviewCard | null)[]>([
    null,
    null,
    null,
  ]);
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
    if (!subscribed || isPending || submitting || revealed[index]) return;

    const usedIds = new Set(previewCards.flatMap((card) => (card ? [card.id] : [])));
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

  if (!subscribed) {
    return (
      <Card className="app-surface overflow-hidden ring-1 ring-accent/15">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-accent" aria-hidden />
            3장 타로
          </CardTitle>
          <CardDescription>
            과거, 현재, 미래를 나눠 보고 싶을 때 여는 심층 리딩이에요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ThreeCardStage revealed={[false, false, false]} disabled />
          <ul className="space-y-1.5 text-[15px] text-muted-foreground">
            <li>- 과거의 반복 패턴을 확인해요.</li>
            <li>- 현재 마음의 중심을 읽어요.</li>
            <li>- 가까운 미래의 방향을 정리해요.</li>
            <li>- 세 장을 합쳐 다음 행동 기준을 만들어요.</li>
          </ul>
          <Button asChild className="w-full" size="lg">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-4 w-4" aria-hidden />
              구독으로 3장 타로 열기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface overflow-hidden ring-1 ring-accent/15">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          3장 타로
        </CardTitle>
        <CardDescription>
          왼쪽부터 과거, 현재, 미래예요. 세 장을 모두 뒤집으면 해석이
          열려요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ThreeCardStage
          revealed={revealed}
          previewCards={previewCards}
          disabled={isBusy}
          onReveal={handleReveal}
        />

        <div className="min-h-6 text-center text-[14px] font-medium text-muted-foreground">
          {isPending || submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              3장 흐름을 읽는 중
            </span>
          ) : revealedCount === 0 ? (
            "과거 카드부터 차례로 눌러보세요."
          ) : revealedCount < 3 ? (
            `${revealedCount} / 3장 열렸어요. 남은 카드를 눌러주세요.`
          ) : (
            "세 장이 모두 열렸어요."
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
            <Label htmlFor="three-question">질문</Label>
            <Input
              id="three-question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="상황이나 선택지를 적어주세요"
              disabled={isBusy}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[15px] text-muted-foreground">
                비워두면 오늘의 과거, 현재, 미래 흐름으로 읽어요.
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
              {THREE_QUESTION_EXAMPLES.map((example) => (
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
          <div className="mt-4 space-y-3">
            <FormMessage
              state={{
                kind: "error",
                message: state.message ?? "3장 타로를 불러오지 못했어요.",
              }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ThreeCardStage({
  revealed,
  previewCards = [null, null, null],
  disabled = false,
  onReveal,
}: {
  revealed: boolean[];
  previewCards?: (PreviewCard | null)[];
  disabled?: boolean;
  onReveal?: (index: number) => void;
}) {
  return (
    <div className="tarot-open-stage tarot-three-open-stage">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {POSITIONS.map((position, index) => (
          <div key={position.key} className="space-y-2 text-center">
            <button
              type="button"
              onClick={() => onReveal?.(index)}
              disabled={disabled || !onReveal || revealed[index]}
              aria-label={`${position.label} 카드 뒤집기`}
              className={cn(
                "tarot-flip-card tarot-three-flip-card",
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
                    sizes="110px"
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
                      sizes="110px"
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
            <div>
              <p className="text-[13px] font-bold">{position.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {position.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

