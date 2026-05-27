"use client";

import { useActionState } from "react";
import { Heart, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/shared/share-button";
import {
  nameCompatibilityAction,
  type NameCompatibilityActionState,
} from "@/app/(dashboard)/name-compatibility/actions";

const initial: NameCompatibilityActionState = { kind: "idle" };
const NAME_INPUT_PATTERN = "[가-힣]{1,6}";

interface NameCompatibilityFormProps {
  defaultMyName?: string;
}

export function NameCompatibilityForm({
  defaultMyName = "",
}: NameCompatibilityFormProps) {
  const [state, formAction, isPending] = useActionState(
    nameCompatibilityAction,
    initial,
  );

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-rose-400" aria-hidden />두 사람의 이름
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nameA">
                내 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nameA"
                name="nameA"
                type="text"
                required
                maxLength={6}
                pattern={NAME_INPUT_PATTERN}
                title="한글 1~6자로 입력해 주세요."
                defaultValue={defaultMyName}
                placeholder="예: 최영탁"
                disabled={isPending}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameB">
                상대 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nameB"
                name="nameB"
                type="text"
                required
                maxLength={6}
                pattern={NAME_INPUT_PATTERN}
                title="한글 1~6자로 입력해 주세요."
                placeholder="예: 김영희"
                disabled={isPending}
                autoComplete="off"
              />
              <p className="text-[15px] text-muted-foreground">
                둘 다 한글 1~6자로 입력해 주세요.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  자음의 결을 짚는 중…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  궁합 보기
                </>
              )}
            </Button>

            {state.kind === "error" && (
              <p className="text-[15px] text-destructive">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {state.kind === "result" && <ResultCard result={state.result} />}
    </div>
  );
}

/** 점수에 따른 카드 액센트 색상. */
const TONE_STYLE: Record<
  "best" | "good" | "ok" | "tough",
  { ring: string; text: string; gradient: string }
> = {
  best: {
    ring: "ring-rose-400/60",
    text: "text-rose-400",
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
  },
  good: {
    ring: "ring-amber-400/50",
    text: "text-amber-400",
    gradient: "from-amber-500/20 via-orange-400/10 to-transparent",
  },
  ok: {
    ring: "ring-sky-400/40",
    text: "text-sky-400",
    gradient: "from-sky-500/15 via-cyan-400/5 to-transparent",
  },
  tough: {
    ring: "ring-stone-500/40",
    text: "text-stone-300",
    gradient: "from-stone-500/15 via-stone-400/5 to-transparent",
  },
};

function ResultCard({
  result,
}: {
  result: NonNullable<
    Extract<NameCompatibilityActionState, { kind: "result" }>
  >["result"];
}) {
  const tone = TONE_STYLE[result.tone];
  return (
    <Card className={`app-surface ring-1 ${tone.ring}`} data-capture-root>
      <CardHeader
        className={`bg-gradient-to-br ${tone.gradient} pb-3 rounded-t-2xl`}
      >
        <p className="text-center text-[15px] text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {result.normalizedNameA}
          </span>
          {"  "}
          <span className="text-muted-foreground">×</span>
          {"  "}
          <span className="font-medium text-foreground/80">
            {result.normalizedNameB}
          </span>
        </p>
        <div className="flex items-baseline justify-center gap-2 pt-2">
          <span
            className={`font-mystic text-5xl font-bold tracking-tight sm:text-6xl ${tone.text}`}
          >
            {result.score}
          </span>
          <span className="font-mystic text-xl text-muted-foreground sm:text-2xl">%</span>
        </div>
        <p className="text-center text-[15px] font-mystic font-semibold text-foreground/90 pt-1">
          {result.label}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px] leading-relaxed pt-5">
        <p className="font-mystic text-lg font-semibold leading-snug text-foreground/95">
          &ldquo;{result.headline}&rdquo;
        </p>
        <p className="text-foreground/85 whitespace-pre-line">
          {result.reading}
        </p>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-[15px] text-muted-foreground/70 mb-1">조언</p>
          <p className="text-foreground/85">{result.advice}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <ShareButton
            title={`${result.normalizedNameA} × ${result.normalizedNameB} — ${result.score}%`}
            text={`${result.normalizedNameA}과(와) ${result.normalizedNameB}의 이름 궁합: ${result.score}점 (${result.label})\n"${result.headline}"`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
