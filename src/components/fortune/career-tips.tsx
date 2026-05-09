"use client";

import { useState, useTransition } from "react";
import { Lock, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateCareerTipsAction } from "@/app/(dashboard)/today/actions";
import type { CareerTipsOutput } from "@/lib/ai/types";

interface CareerTipsProps {
  subscribed: boolean;
}

/**
 * 직장 운세 프리미엄 전용 — "직장에서 예쁨받는 방법" 3가지 팁 카드.
 *
 * - 프리미엄 사용자: 버튼 클릭 시 AI 팁 3가지를 생성하여 표시한다.
 * - 비프리미엄 사용자: 흐릿한 미리보기 + 프리미엄 유도 CTA를 표시한다.
 */
export function CareerTips({ subscribed }: CareerTipsProps) {
  const [tips, setTips] = useState<CareerTipsOutput["tips"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCareerTipsAction();
      if (result.kind === "success" && result.tips) {
        setTips(result.tips);
      } else {
        setError(result.message ?? "오류가 발생했어.");
      }
    });
  }

  if (!subscribed) {
    return (
      <Card className="app-surface ring-1 ring-accent/20">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-accent" aria-hidden />
            직장에서 예쁨받는 방법
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              프리미엄
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 select-none blur-[3px] pointer-events-none">
            {["상사와 신뢰 쌓기", "팀워크 높이기", "긍정 에너지 발산"].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 rounded-full bg-accent/30 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t}</p>
                  <p className="text-xs text-muted-foreground">
                    구체적인 방법이 여기에 표시돼요...
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              프리미엄으로 확인하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tips) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            직장에서 예쁨받는 방법
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-mystic text-sm font-semibold">{tip.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
          직장에서 예쁨받는 방법
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          나의 성격과 기운을 바탕으로 오늘 직장에서 예쁨받는 방법 3가지를 알려줄게.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              분석 중…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              팁 받기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
