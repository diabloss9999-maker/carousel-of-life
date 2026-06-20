"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { Flower2, Loader2, RefreshCcw, Sparkles } from "lucide-react";

import {
  flowerOracleAction,
  type FlowerOracleActionState,
} from "@/app/(dashboard)/flower-oracle/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SaveImageButton } from "@/components/shared/save-image-button";
import { ShareButton } from "@/components/shared/share-button";
import { safeReadingText, safeShortText } from "@/lib/content/safety";
import { breakSentences } from "@/lib/utils";

const initial: FlowerOracleActionState = { kind: "idle" };

export function FlowerOracleClient() {
  const [state, formAction, isPending] = useActionState(
    flowerOracleAction,
    initial,
  );
  const [history, setHistory] = useState<string[]>([]);
  const resultFlowerId = state.kind === "result" ? state.result.flower.id : null;

  useEffect(() => {
    if (!resultFlowerId) return;
    queueMicrotask(() => {
      setHistory((prev) =>
        prev.includes(resultFlowerId)
          ? prev
          : [resultFlowerId, ...prev].slice(0, 3),
      );
    });
  }, [resultFlowerId]);

  return (
    <div className="space-y-6">
      {state.kind !== "result" ? (
        <Card className="app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <Flower2 className="h-5 w-5 text-rose-300" aria-hidden />
              꽃을 뽑아볼까요?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
              오늘 마음에 닿는 꽃을 한 장 뽑아보세요. 매일 고정되는 오늘의 꽃과,
              지금 기분으로 다시 뽑는 자유 뽑기를 사용할 수 있어요.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <form action={formAction}>
                <input type="hidden" name="mode" value="daily" />
                <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      꽃을 뽑는 중
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden />
                      오늘의 꽃 뽑기
                    </>
                  )}
                </Button>
              </form>
              <form action={formAction}>
                <input type="hidden" name="mode" value="free" />
                <input type="hidden" name="excludeIds" value={history.join(",")} />
                <Button
                  type="submit"
                  size="lg"
                  variant="outline"
                  className="w-full"
                  disabled={isPending}
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden />
                  자유롭게 뽑기
                </Button>
              </form>
            </div>

            {state.kind === "error" ? (
              <p className="mt-4 text-[15px] text-destructive">
                {state.message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {state.kind === "result" ? (
        <ResultCard
          result={state.result}
          history={history}
          formAction={formAction}
          isPending={isPending}
        />
      ) : null}
    </div>
  );
}

function ResultCard({
  result,
  history,
  formAction,
  isPending,
}: {
  result: Extract<FlowerOracleActionState, { kind: "result" }>["result"];
  history: string[];
  formAction: (formData: FormData) => void;
  isPending: boolean;
}) {
  const flower = result.flower;
  const headline = safeShortText(
    result.headline,
    `${flower.koreanName}이 오늘의 작은 힌트를 건네요.`,
  );
  const reading = safeReadingText(
    result.reading,
    `${flower.koreanName}의 꽃말은 "${flower.meaning}"이에요. 오늘은 마음을 급하게 밀어붙이기보다, 작은 신호를 차분히 살피면 좋아요.`,
  );
  const todayAction = safeReadingText(
    result.todayAction,
    "오늘 꼭 해야 할 일 하나만 고르고, 끝까지 마무리해 보세요.",
  );

  return (
    <Card className={`app-surface ring-1 ${flower.accent}`} data-capture-root>
      <CardHeader className="space-y-2 pb-3 text-center">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          {result.mode === "daily" ? "오늘의 꽃" : "지금의 꽃"}
        </p>
        <CardTitle className="font-mystic text-2xl">
          {flower.koreanName}
        </CardTitle>
        <p className="text-[15px] italic text-muted-foreground">
          {flower.scientificName}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-xs overflow-hidden rounded-xl shadow-md">
          <Image
            src={flower.image}
            alt={`${flower.koreanName} 이미지`}
            fill
            sizes="(max-width: 640px) 80vw, 320px"
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-1 text-center">
          <p className="text-[15px] text-muted-foreground">꽃말</p>
          <p className="font-mystic text-lg font-semibold leading-snug text-foreground/95">
            &ldquo;{flower.meaning}&rdquo;
          </p>
        </div>

        <div className="space-y-3 text-[15px] leading-relaxed">
          <p className="font-mystic text-lg font-semibold leading-snug text-foreground/95">
            {headline}
          </p>
          <p className="whitespace-pre-line text-foreground/85">
            {breakSentences(reading)}
          </p>
          <div className="rounded-xl bg-muted/30 px-4 py-3">
            <p className="mb-1 text-[13px] font-semibold text-muted-foreground">
              오늘 해볼 일
            </p>
            <p className="text-foreground/90">{todayAction}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <form action={formAction} className="inline">
            <input type="hidden" name="mode" value="free" />
            <input type="hidden" name="excludeIds" value={history.join(",")} />
            <Button type="submit" variant="outline" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCcw className="h-4 w-4" aria-hidden />
              )}
              다시 뽑기
            </Button>
          </form>
          <SaveImageButton filename={`flower-${flower.id}-${flower.koreanName}`} />
          <ShareButton
            title={`오늘의 꽃점: ${flower.koreanName}`}
            text={`${flower.koreanName} - ${headline}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
