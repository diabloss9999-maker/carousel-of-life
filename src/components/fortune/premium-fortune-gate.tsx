import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import type { FortuneCategoryId } from "@/lib/constants";

interface PremiumFortuneGateProps {
  category: FortuneCategoryId;
}

const GATE_COPY: Record<string, { title: string; description: string }> = {
  zodiac: {
    title: "별자리 운세 — 라이트 전용",
    description:
      "황도 12궁의 별자리 기운으로 오늘을 풀이해줄게. 라이트를 구독하면 별자리·십이간지 운세를 매일 받아볼 수 있어.",
  },
  chinese_zodiac: {
    title: "십이간지 운세 — 라이트 전용",
    description:
      "12지신의 띠 기운으로 오늘의 흐름을 짚어줄게. 라이트를 구독하면 별자리·십이간지 운세를 매일 받아볼 수 있어.",
  },
};

export function PremiumFortuneGate({ category }: PremiumFortuneGateProps) {
  const copy = GATE_COPY[category] ?? {
    title: "라이트 전용",
    description: "이 운세는 라이트 구독자 전용이야.",
  };

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10">
          <Lock className="h-6 w-6 text-amber-400" aria-hidden />
        </div>
        <CardTitle className="font-mystic text-center text-xl">
          {copy.title}
        </CardTitle>
        <CardDescription className="text-center text-sm leading-relaxed">
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button asChild size="lg" className="w-full max-w-xs">
          <Link href={ROUTES.pricing}>
            <Sparkles className="h-4 w-4" aria-hidden />
            라이트 구독하기
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          구독 시 별자리·십이간지·라이트 기능 전체 이용 가능
        </p>
      </CardContent>
    </Card>
  );
}
