"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Flower2, Loader2, RefreshCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShareButton } from "@/components/shared/share-button";
import { SaveImageButton } from "@/components/shared/save-image-button";
import {
  flowerOracleAction,
  type FlowerOracleActionState,
} from "@/app/(dashboard)/flower-oracle/actions";

const initial: FlowerOracleActionState = { kind: "idle" };

export function FlowerOracleClient() {
  const [state, formAction, isPending] = useActionState(
    flowerOracleAction,
    initial,
  );
  const [history, setHistory] = useState<string[]>([]); // 자유 뽑기 시 직전 카드 제외용

  // 결과가 새로 오면 history 에 추가
  if (state.kind === "result" && !history.includes(state.result.flower.id)) {
    // 최근 3장 까지만 제외 (그 이상은 다시 풀에 들어감)
    setHistory((prev) => [state.result.flower.id, ...prev].slice(0, 3));
  }

  return (
    <div className="space-y-6">
      {state.kind !== "result" && (
        <Card className="app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <Flower2 className="h-5 w-5 text-rose-300" aria-hidden />
              한 송이를 펴주세요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
              오늘의 꽃은 같은 날엔 같은 송이를 보여줘요. 다른 결을 보고 싶다면
              자유 뽑기로 한 송이 더 펴볼 수 있어요.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <form action={formAction}>
                <input type="hidden" name="mode" value="daily" />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      꽃잎을 읽는 중…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden />
                      오늘의 꽃 받기
                    </>
                  )}
                </Button>
              </form>
              <form action={formAction}>
                <input type="hidden" name="mode" value="free" />
                <input
                  type="hidden"
                  name="excludeIds"
                  value={history.join(",")}
                />
                <Button
                  type="submit"
                  size="lg"
                  variant="outline"
                  className="w-full"
                  disabled={isPending}
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden />
                  자유 뽑기
                </Button>
              </form>
            </div>

            {state.kind === "error" && (
              <p className="mt-4 text-[15px] text-destructive">
                {state.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {state.kind === "result" && (
        <ResultCard
          result={state.result}
          history={history}
          formAction={formAction}
          isPending={isPending}
        />
      )}
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
  return (
    <Card
      className={`app-surface ring-1 ${flower.accent}`}
      data-capture-root
    >
      <CardHeader className="space-y-2 text-center pb-3">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          {result.mode === "daily" ? "오늘의 꽃" : "한 송이 더"}
        </p>
        <CardTitle className="font-mystic text-2xl">
          {flower.koreanName}
        </CardTitle>
        <p className="text-[15px] italic text-muted-foreground">
          {flower.scientificName}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 꽃 이미지 */}
        <div className="relative mx-auto aspect-[2/3] w-full max-w-xs overflow-hidden rounded-xl shadow-md">
          <Image
            src={flower.image}
            alt={`${flower.koreanName} 일러스트`}
            fill
            sizes="(max-width: 640px) 80vw, 320px"
            className="object-cover"
            priority
          />
        </div>

        {/* 꽃말 */}
        <div className="text-center space-y-1">
          <p className="text-[15px] text-muted-foreground">꽃말</p>
          <p className="font-mystic text-lg font-semibold leading-snug text-foreground/95">
            &ldquo;{flower.meaning}&rdquo;
          </p>
        </div>

        {/* AI 풀이 */}
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p className="font-mystic text-lg font-semibold leading-snug text-foreground/95">
            {result.headline}
          </p>
          <p className="whitespace-pre-line text-foreground/85">
            {result.reading}
          </p>
          <div className="rounded-xl bg-muted/30 px-4 py-3">
            <p className="text-[15px] text-muted-foreground/70 mb-1">
              오늘의 작은 행동
            </p>
            <p className="text-foreground/90">{result.todayAction}</p>
          </div>
        </div>

        {/* 액션 */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <form action={formAction} className="inline">
            <input type="hidden" name="mode" value="free" />
            <input type="hidden" name="excludeIds" value={history.join(",")} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCcw className="h-4 w-4" aria-hidden />
              )}
              한 송이 더
            </Button>
          </form>
          <SaveImageButton filename={`flower-${flower.id}-${flower.koreanName}`} />
          <ShareButton
            title={`${flower.koreanName} — ${flower.meaning}`}
            text={`오늘의 꽃: ${flower.koreanName}\n"${result.headline}"\n\n— 인생의 회전목마 · 플로로랜시`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
