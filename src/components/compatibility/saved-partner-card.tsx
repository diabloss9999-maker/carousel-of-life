"use client";

import { useActionState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import {
  compatForPartnerAction,
  compatForPartnerIdleState,
  deletePartnerAction,
} from "@/app/(dashboard)/compatibility/actions";
import type { CompatibilityReading, SavedPartner } from "@/db/schema";
import { cn } from "@/lib/utils";
import { getZodiacSign } from "@/lib/fortunes/zodiac";

interface SavedPartnerCardProps {
  partner: SavedPartner;
  todayReading: CompatibilityReading | null;
}

export function SavedPartnerCard({
  partner,
  todayReading,
}: SavedPartnerCardProps) {
  const [state, formAction, isPending] = useActionState(
    compatForPartnerAction,
    compatForPartnerIdleState,
  );

  const zodiac = getZodiacSign(partner.birthDate);

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-mystic text-lg font-semibold">
                {partner.name}
              </p>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                {partner.relationship ?? "친구"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {partner.birthDate}
              {partner.calendarSystem === "lunar" ? " (음력)" : ""} · {zodiac.ko}
              {partner.mbti ? ` · ${partner.mbti}` : ""}
            </p>
          </div>

          <form action={deletePartnerAction}>
            <input type="hidden" name="partnerId" value={partner.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="상대 삭제"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {todayReading ? (
          <div className="space-y-2 rounded-xl border border-border/60 bg-card/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                오늘의 풀이
              </span>
              <ScoreBadge score={todayReading.score} />
            </div>
            <p className="font-mystic text-base font-medium">
              {todayReading.summary}
            </p>
            <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/85">
              {todayReading.detail}
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="partnerId" value={partner.id} />
            {state.kind === "error" ? (
              <FormMessage
                state={{ kind: "error", message: state.message ?? "" }}
              />
            ) : null}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
              variant="outline"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  오늘 운세 풀이 중…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  오늘 운세 받기
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mystic text-xs font-medium",
        tone,
      )}
      aria-label={`궁합 점수 ${score}점`}
    >
      {score}점
    </span>
  );
}
