"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  drawThreeTarotAction,
  type TarotDrawState,
} from "@/app/(dashboard)/tarot/actions";

const initial: TarotDrawState = { kind: "idle" };
const MAX_QUESTION_LENGTH = 100;

interface TarotThreeFormProps {
  /** 활성 구독자 여부. false 면 자물쇠 + 결제 CTA. */
  subscribed: boolean;
}

export function TarotThreeForm({ subscribed }: TarotThreeFormProps) {
  const [state, formAction, isPending] = useActionState(
    drawThreeTarotAction,
    initial,
  );
  const [question, setQuestion] = useState("");
  const charsLeft = MAX_QUESTION_LENGTH - question.length;
  const t = useTranslations("tarotForm");

  useScrollToResult(isPending, "tarot-results");

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-accent" aria-hidden />
            {t("threeLightTitle")}
          </CardTitle>
          <CardDescription>
            {t("threeBody")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5 text-[15px] text-muted-foreground">
            <li>· {t("threeBullet1")}</li>
            <li>· {t("threeBullet2")}</li>
            <li>· {t("threeBullet3")}</li>
            <li>· {t("threeBullet4")}</li>
          </ul>
          <Button asChild className="w-full" size="lg">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t("threeCta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          {t("threeTitle")}
        </CardTitle>
        <CardDescription>
          {t("threeBody")}
          {isPending ? ` ${t("shuffling")}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          {[
            { rotate: -10, translateY: 10 },
            { rotate: 0,   translateY: 0  },
            { rotate: 10,  translateY: 10 },
          ].map(({ rotate, translateY }, i) => (
            <div
              key={i}
              className={cn(
                "w-24 sm:w-36 md:w-44 -ml-8 sm:-ml-12 first:ml-0 transition-opacity duration-500",
                isPending && "opacity-60",
                i === 1 ? "z-10" : "z-0",
              )}
              style={{
                transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
              }}
            >
              <Image
                src="/tarot/card_back.webp"
                alt={t("cardBackAlt")}
                width={448}
                height={672}
                className="w-full rounded-xl shadow-lg"
              />
            </div>
          ))}
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="three-question">
              {t("questionLabel")}
            </Label>
            <Input
              id="three-question"
              name="question"
              type="text"
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("threeQuestionPlaceholder")}
              disabled={isPending}
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[15px] text-muted-foreground">
                {t("threeQuestionHint")}
              </p>
              <span
                className={cn(
                  "text-[15px] tabular-nums shrink-0",
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

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("threeLoading")}
              </>
            ) : (
              t("threeDraw")
            )}
          </Button>
        </form>

        {state.kind === "error" ? (
          <div className="space-y-3 mt-4">
            <FormMessage
              state={{
                kind: "error",
                message: state.message ?? t("threeError"),
              }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
