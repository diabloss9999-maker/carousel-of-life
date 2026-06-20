"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BarChart3,
  CalendarDays,
  Loader2,
  ScrollText,
  Sparkles,
} from "lucide-react";

import { calculateSajuAction } from "@/app/(dashboard)/saju/actions";
import { Button } from "@/components/ui/button";

export function CalculateSajuButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await calculateSajuAction();
      if (result.kind === "error") {
        setError(result.message ?? "사주 계산에 실패했어요.");
        return;
      }
      router.refresh();
      setTimeout(() => {
        document
          .getElementById("saju-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          {
            icon: ScrollText,
            title: "사주 명식",
            body: "태어난 날의 기본 구조를 정리해요.",
          },
          {
            icon: BarChart3,
            title: "오행 균형",
            body: "강한 기운과 보완할 기운을 보여줘요.",
          },
          {
            icon: CalendarDays,
            title: "오늘 일진",
            body: "오늘 흐름과 내 기질을 연결해요.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3"
          >
            <div className="flex items-center gap-2 text-primary">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-[13px] font-semibold text-foreground">
                {title}
              </p>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            사주 계산 중
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden />
            사주 계산하기
          </>
        )}
      </Button>
      {error ? <p className="text-[15px] text-destructive">{error}</p> : null}
    </div>
  );
}
