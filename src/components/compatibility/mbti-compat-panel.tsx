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
import {
  getMbtiCompat,
  MBTI_TYPES,
  type MbtiCompatResult,
} from "@/lib/compatibility/mbti-compat";
import type { PersonalityType } from "@/lib/personality/questions";
import { cn } from "@/lib/utils";

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/;

const MBTI_NICKNAME: Record<PersonalityType, string> = {
  ISTJ: "신중한 관리자",
  ISFJ: "따뜻한 보호자",
  INFJ: "깊은 조언자",
  INTJ: "전략적인 설계자",
  ISTP: "침착한 해결사",
  ISFP: "섬세한 감각형",
  INFP: "이상적인 중재자",
  INTP: "논리적인 탐구자",
  ESTP: "현실적인 모험가",
  ESFP: "밝은 분위기 메이커",
  ENFP: "자유로운 영감형",
  ENTP: "재치 있는 토론가",
  ESTJ: "실행력 있는 관리자",
  ESFJ: "다정한 조율자",
  ENFJ: "따뜻한 리더",
  ENTJ: "결단력 있는 지휘자",
};

interface MbtiCompatPanelProps {
  myMbti: PersonalityType | null;
}

export function MbtiCompatPanel({ myMbti }: MbtiCompatPanelProps) {
  const [manualMe, setManualMe] = useState("");
  const [partner, setPartner] = useState<PersonalityType | null>(null);

  const effectiveMe: PersonalityType | null =
    myMbti ??
    (MBTI_PATTERN.test(manualMe.toUpperCase())
      ? (manualMe.toUpperCase() as PersonalityType)
      : null);

  const result: MbtiCompatResult | null =
    effectiveMe && partner
      ? getMbtiCompat(effectiveMe, partner, "ko", {
          meNickname: MBTI_NICKNAME[effectiveMe],
          partnerNickname: MBTI_NICKNAME[partner],
          meStrength0: "관찰력",
          partnerStrength0: "표현력",
        })
      : null;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <BookHeart className="h-5 w-5 text-accent" aria-hidden />
          MBTI 궁합
        </CardTitle>
        <CardDescription className="text-[15px]">
          나와 상대의 성향 차이를 가볍게 비교해요.
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
              placeholder="예: INFP"
              className="uppercase"
            />
            {manualMe && !MBTI_PATTERN.test(manualMe.toUpperCase()) ? (
              <p className="text-[15px] text-destructive">
                E/I, N/S, T/F, J/P 순서로 입력해 주세요.
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-[15px] text-muted-foreground">
            상대 MBTI를 선택하세요.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map((type) => {
              const selected = partner === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPartner(type)}
                  className={cn(
                    "rounded-xl border px-2 py-3 text-center text-[15px] transition-all",
                    selected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-card/40 hover:-translate-y-0.5 hover:bg-card/80",
                  )}
                  aria-pressed={selected}
                >
                  <span className="block font-mystic text-base font-semibold">
                    {type}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">
                    {MBTI_NICKNAME[type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl app-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-mystic text-[15px] text-muted-foreground">
                {result.me.type} × {result.partner.type}
              </p>
              <ScoreBadge score={result.score} />
            </div>
            <p className="font-mystic text-base font-medium leading-relaxed">
              {result.headline}
            </p>
            <p className="whitespace-pre-line font-mystic text-[15px] leading-relaxed text-foreground/85">
              {result.detail}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-[15px] text-muted-foreground">
            내 MBTI와 상대 MBTI가 정해지면 궁합 결과가 보여요.
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
        "rounded-full px-3 py-0.5 font-mystic text-[15px] font-medium",
        tone,
      )}
    >
      {score}점
    </span>
  );
}
