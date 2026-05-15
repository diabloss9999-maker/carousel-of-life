"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { calculateSajuAction } from "@/app/(dashboard)/saju/actions";

export function CalculateSajuButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("sajuButtons");

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await calculateSajuAction();
      if (result.kind === "error") {
        setError(result.message ?? t("error"));
        return;
      }
      router.refresh();
      // 페이지 업데이트 후 결과 영역으로 스크롤
      setTimeout(() => {
        document
          .getElementById("saju-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    });
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("calculating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden /> {t("calculateCta")}
          </>
        )}
      </Button>
      {error ? <p className="text-[15px] text-destructive">{error}</p> : null}
    </div>
  );
}
