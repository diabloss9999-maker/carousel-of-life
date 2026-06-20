"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { track } from "@vercel/analytics";

import {
  generateFortuneAction,
  type FortuneActionState,
} from "@/app/(dashboard)/today/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { ROUTES } from "@/lib/constants";

interface GenerateFortuneFormProps {
  category: string;
  categoryLabel: string;
}

const initial: FortuneActionState = { kind: "idle" };

const COPY: Record<string, string> = {
  general: "오늘 하루의 전체 흐름을 먼저 확인해볼게요.",
  love: "오늘 마음과 관계의 온도를 차분히 살펴볼게요.",
  money: "오늘 돈의 흐름과 조심할 소비를 확인해볼게요.",
  career: "오늘 일과 선택의 우선순위를 정리해볼게요.",
  health: "오늘 몸과 마음의 컨디션 신호를 확인해볼게요.",
  study: "오늘 집중이 잘 붙는 방향을 찾아볼게요.",
  zodiac: "별자리 흐름으로 오늘의 분위기를 살펴볼게요.",
  chinese_zodiac: "띠별 흐름으로 오늘의 기준을 정리해볼게요.",
};

const PREVIEW_POINTS = [
  "오늘 조심할 흐름",
  "붙잡아야 할 기회",
  "바로 해볼 행동",
] as const;

export function GenerateFortuneForm({
  category,
  categoryLabel,
}: GenerateFortuneFormProps) {
  const [state, formAction, isPending] = useActionState(
    generateFortuneAction,
    initial,
  );

  useScrollToResult(isPending, "fortune-result");

  const line = COPY[category] ?? `${categoryLabel}을 지금 기준으로 정리해볼게요.`;

  function trackedFormAction(formData: FormData) {
    track("fortune_generate_submit", { category });
    formAction(formData);
  }

  return (
    <div className="liquid-glass-panel liquid-fortune-card overflow-hidden p-4 sm:p-5">
      <div className="liquid-oracle-header overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-keep flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Personal Reading
                </p>
                <p className="font-mystic text-pretty-ko text-lg font-semibold leading-snug text-foreground/90">
                  {categoryLabel} 리포트를 시작해요
                </p>
              </div>
            </div>
            <p className="font-mystic text-pretty-ko text-base font-semibold leading-snug text-foreground/90">
              {line}
            </p>
            <p className="text-keep text-[15px] text-muted-foreground/60">
              생년월일과 사주 흐름을 함께 참고해 오늘의 기준을 만들어요.
            </p>
            <div className="grid gap-2 pt-1 sm:grid-cols-3">
              {PREVIEW_POINTS.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2"
                >
                  <p className="text-[12px] font-semibold text-primary">
                    {index + 1}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-foreground/80">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form action={trackedFormAction}>
            <input type="hidden" name="category" value={category} />
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="liquid-glass-action w-full rounded-full font-mystic"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  운세를 불러오는 중
                </>
              ) : (
                `${categoryLabel} 보기`
              )}
            </Button>
          </form>

          {state.kind === "error" ? (
            <div className="space-y-2">
              <FormMessage
                state={{ kind: "error", message: state.message ?? "" }}
              />
              {state.quotaExceeded ? (
                <Button asChild className="w-full" variant="outline" size="sm">
                  <Link href={ROUTES.pricing}>무제한으로 이용하기</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
