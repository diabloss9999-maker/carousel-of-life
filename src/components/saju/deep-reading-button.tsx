"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { generateDeepReadingAction } from "@/app/(dashboard)/saju/actions";

interface DeepReadingButtonProps {
  /** true 면 자물쇠 모양 + 결제 CTA, false 면 즉시 생성 가능. */
  locked: boolean;
}

export function DeepReadingButton({ locked }: DeepReadingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateDeepReadingAction();
      if (result.kind === "error") {
        setError(result.message ?? "오류가 났어");
        return;
      }
      router.refresh();
      setTimeout(() => {
        document
          .getElementById("saju-deep-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    });
  }

  if (locked) {
    return (
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-accent" aria-hidden />
            <CardTitle className="font-mystic text-xl">
              심층 분석은 라이트 멤버십
            </CardTitle>
          </div>
          <CardDescription>
            한 번 적히면 평생 곁에 두는 풀이야. 성격·강점·연애·일·건강·인생
            흐름까지 7가지 주제로 깊게 풀어줄게.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>· 성격과 타고난 결</li>
            <li>· 빛이 나는 자리 (강점)</li>
            <li>· 조심할 점 (약한 기운)</li>
            <li>· 연애 스타일과 잘 맞는 사람</li>
            <li>· 잘 풀리는 직업 분야</li>
            <li>· 건강 관리 포인트</li>
            <li>· 인생 큰 흐름</li>
          </ul>
          <Button asChild className="w-full" size="lg">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-4 w-4" aria-hidden />
              라이트로 풀어보기
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          <CardTitle className="font-mystic text-xl">
            심층 분석이 아직 없어
          </CardTitle>
        </div>
        <CardDescription>
          7가지 주제로 깊은 풀이를 적어줄게. 한 번 적히면 평생 보관돼. 약 1분
          정도 걸려.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          className="w-full"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              깊이 살펴보는 중…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              심층 분석 받기
            </>
          )}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
