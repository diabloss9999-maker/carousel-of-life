"use client";

import { useState } from "react";
import { BookHeart } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TYPE_INFO } from "@/lib/personality/types";
import type { PersonalityType } from "@/lib/personality/questions";
import {
  getMbtiCompat,
  MBTI_TYPES,
  type MbtiCompatResult,
} from "@/lib/compatibility/mbti-compat";
import { cn } from "@/lib/utils";

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/;

interface MbtiCompatPanelProps {
  myMbti: PersonalityType | null;
}

export function MbtiCompatPanel({ myMbti }: MbtiCompatPanelProps) {
  const [manualMe, setManualMe] = useState("");
  const [partner, setPartner] = useState<PersonalityType | null>(null);

  const effectiveMe: PersonalityType | null =
    myMbti ?? (MBTI_PATTERN.test(manualMe.toUpperCase())
      ? (manualMe.toUpperCase() as PersonalityType)
      : null);

  const result: MbtiCompatResult | null =
    effectiveMe && partner ? getMbtiCompat(effectiveMe, partner) : null;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <BookHeart className="h-5 w-5 text-accent" aria-hidden />
          MBTI 궁합
        </CardTitle>
        <CardDescription className="text-xs">
          {myMbti
            ? `내 MBTI: ${myMbti} (${TYPE_INFO[myMbti].nickname}). 상대 MBTI 를 골라봐.`
            : "내 MBTI 를 먼저 알려주면 더 정확해."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!myMbti ? (
          <div className="space-y-2">
            <Label htmlFor="manualMbti">내 MBTI</Label>
            <Input
              id="manualMbti"
              value={manualMe}
              onChange={(e) => setManualMe(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="예: ENFP"
              className="uppercase"
            />
            {manualMe && !MBTI_PATTERN.test(manualMe.toUpperCase()) ? (
              <p className="text-xs text-destructive">
                네 글자 MBTI 를 정확히 적어줘.
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs text-muted-foreground">상대 MBTI</p>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map((t) => {
              const selected = partner === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPartner(t)}
                  className={cn(
                    "rounded-xl border px-2 py-3 text-center text-sm transition-all",
                    selected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-card/40 hover:-translate-y-0.5 hover:bg-card/80",
                  )}
                  aria-pressed={selected}
                >
                  <span className="block font-mystic text-base font-semibold">
                    {t}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {TYPE_INFO[t].nickname}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mystic text-sm text-muted-foreground">
                {result.me.type} × {result.partner.type}
              </p>
              <ScoreBadge score={result.score} />
            </div>
            <p className="font-mystic text-base font-medium leading-relaxed">
              {result.headline}
            </p>
            <p className="font-mystic whitespace-pre-line text-sm leading-relaxed text-foreground/85">
              {result.detail}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-sm text-muted-foreground">
            {effectiveMe
              ? "상대 MBTI 를 골라봐."
              : "내 MBTI 부터 알려줘."}
          </p>
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
        "rounded-full px-3 py-0.5 font-mystic text-sm font-medium",
        tone,
      )}
    >
      {score}점
    </span>
  );
}
