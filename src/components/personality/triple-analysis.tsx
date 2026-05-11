"use client";

/**
 * 유형 프리미엄 D — 사주 × 별자리 × 성격유형 통합 분석 카드.
 *
 * 한 번 생성되면 영구 저장되어 동일 결과를 평생 보여준다.
 */
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Layers, Loader2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  generateTripleAnalysisAction,
  type TripleAnalysisState,
} from "@/app/(dashboard)/personality/actions";
import type { TripleAnalysisOutput } from "@/lib/ai/types";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

interface TripleAnalysisProps {
  subscribed: boolean;
}

export function TripleAnalysis({ subscribed }: TripleAnalysisProps) {
  const [data, setData] = useState<TripleAnalysisOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [didAutoLoad, setDidAutoLoad] = useState(false);

  // 프리미엄 사용자는 영구 저장된 결과가 있을 수 있으므로 마운트 시 자동 로드 시도.
  useEffect(() => {
    if (!subscribed || didAutoLoad) return;
    setDidAutoLoad(true);
    startTransition(async () => {
      const result: TripleAnalysisState = await generateTripleAnalysisAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      }
      // 첫 로드 실패는 조용히 — 사용자가 버튼으로 다시 시도할 수 있다.
    });
  }, [subscribed, didAutoLoad]);

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: TripleAnalysisState = await generateTripleAnalysisAction();
      if (result.kind === "success" && result.data) {
        setData(result.data);
      } else {
        setErrorMsg(result.message ?? "분석에 실패했어.");
      }
    });
  };

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" />
            사주 × 별자리 × 성격유형 통합 분석
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="blur-[3px] select-none pointer-events-none space-y-2">
            <p className="text-sm">세 시스템의 공통점</p>
            <p className="text-sm">모순되는 측면</p>
            <p className="text-sm">통합 본성 + 독특한 강점</p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" />
              프리미엄으로 확인하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (data) {
    const charId = getTodayCharacter();
    const character = CHARACTERS[charId];
    return (
      <Card className="app-surface">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-mystic flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-accent" />
              사주 × 별자리 × 성격유형 통합 분석
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative h-9 w-6 overflow-hidden rounded-lg shadow-sm">
                <Image src={character.imageSrc} alt={character.name} fill className="object-cover object-top" sizes="24px" />
              </div>
              <p className="font-mystic text-[10px] font-semibold text-foreground/70">{character.name}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              세 시스템의 공통점
            </p>
            <p className="font-mystic leading-relaxed">{data.convergence}</p>
          </div>

          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              서로 모순되는 측면
            </p>
            <p className="font-mystic leading-relaxed">{data.contradiction}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                진짜 본성
              </p>
              <p className="font-mystic leading-relaxed">{data.trueNature}</p>
            </div>
            <div className="border-t border-border/40 pt-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                이 조합만의 독특한 강점
              </p>
              <p className="font-mystic leading-relaxed">
                {data.uniqueStrength}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-accent" />
          사주 × 별자리 × 성격유형 통합 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          세 시스템이 동시에 말하는 너의 진짜 성격을 분석해 봐. 한 번 생성하면
          평생 보관돼.
        </p>
        {errorMsg ? (
          <p className="text-xs text-destructive">{errorMsg}</p>
        ) : null}
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              세 시스템을 통합 분석하는 중...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              통합 분석 받기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
