"use client";

/**
 * 엘더 푸타르크 룬 던지기 폼.
 *
 * 지원 스프레드:
 * - single : 한 개 — 오늘의 룬
 * - three  : 세 개 — 노른스 (과거·현재·미래)
 * - five   : 다섯 개 — 십자형 (프리미엄)
 * - nine   : 아홉 개 — 3×3 종합 (프리미엄)
 */
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
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

type SpreadValue = "single" | "three" | "five" | "nine";

interface Props {
  /** 활성 구독자 여부 — five/nine 스프레드는 구독자만 사용 가능. */
  subscribed: boolean;
}

export function RuneDrawForm({ subscribed }: Props) {
  const [state, formAction, isPending] = useActionState(
    drawRuneAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<SpreadValue>("single");
  const charsLeft = MAX_QUESTION_LENGTH - question.length;

  useScrollToResult(isPending, "rune-results");

  const isPremiumSpread = spread === "five" || spread === "nine";
  const blockedByPremium = isPremiumSpread && !subscribed;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          엘더 푸타르크 룬
        </CardTitle>
        <CardDescription>
          24개의 고대 룬 중에서 운명의 돌을 던져봐.
          {isPending ? " 룬을 고르는 중…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div
            className={cn(
              "relative aspect-[2/3] w-36 overflow-hidden rounded-xl transition-opacity sm:w-44",
              isPending && "opacity-60",
            )}
          >
            <Image
              src="/collection/card_back.png"
              alt="룬 뒷면"
              fill
              className="object-cover"
              sizes="176px"
            />
          </div>
        </div>

        <form action={formAction} className="space-y-4">
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
              disabled={isPending}
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
              disabled={isPending}
            >
              <option value="single">한 개 — 오늘의 룬</option>
              <option value="three">세 개 — 노른스 (과거·현재·미래)</option>
              <option value="five">
                다섯 개 — 십자형 스프레드 (프리미엄)
              </option>
              <option value="nine">
                아홉 개 — 3×3 종합 스프레드 (프리미엄)
              </option>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2">
            <input
              type="checkbox"
              id="reversed-toggle"
              name="reversedEnabled"
              defaultChecked
              disabled={isPending}
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
              <Button
                asChild
                className="mt-2 w-full"
                variant="outline"
                size="sm"
              >
                <Link href={ROUTES.pricing}>프리미엄 구독하기</Link>
              </Button>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isPending || blockedByPremium}
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                룬을 고르는 중…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                룬 던지기
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
