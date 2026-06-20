"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Heart,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
        setError(result.message ?? "심층 해석 생성에 실패했어요.");
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
              사주 심층 해석
            </CardTitle>
          </div>
          <CardDescription>
            기본 명식보다 더 자세히, 성향과 관계, 일의 방향까지 이어서
            볼 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <UnlockPreview icon={Brain} title="성향" body="반복되는 선택 패턴" />
            <UnlockPreview icon={Heart} title="관계" body="마음이 움직이는 방식" />
            <UnlockPreview icon={Briefcase} title="일과 돈" body="나에게 맞는 역할과 흐름" />
          </div>
          <ul className="space-y-1.5 text-[15px] text-muted-foreground">
            <li>- 기질과 강점, 조심할 점을 나눠 정리해요.</li>
            <li>- 관계, 커리어, 건강 흐름까지 함께 봐요.</li>
            <li>- 오늘 바로 적용할 기준으로 읽을 수 있어요.</li>
          </ul>
          <Button asChild className="w-full" size="lg">
            <Link href={`${ROUTES.pricing}?from=saju`}>
              <Sparkles className="h-4 w-4" aria-hidden />
              멤버십으로 심층 해석 열기
              <ArrowRight className="h-4 w-4" aria-hidden />
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
            사주 심층 해석 만들기
          </CardTitle>
        </div>
        <CardDescription>
          기본 명식을 바탕으로 성향, 관계, 일, 건강의 흐름을 더 자세히
          정리해요.
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
              심층 해석 생성 중
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              심층 해석 받기
            </>
          )}
        </Button>
        {error ? <p className="text-[15px] text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function UnlockPreview({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[12px] font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
