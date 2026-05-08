"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resetSajuAction } from "@/app/(dashboard)/saju/actions";

export function ResetSajuButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("사주를 다시 계산할게. 기존 심층 분석도 초기화돼. 계속할까?")) return;
    setError(null);
    startTransition(async () => {
      const result = await resetSajuAction();
      if (result.kind === "error") {
        setError(result.message ?? "오류가 났어");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="gap-2 text-muted-foreground"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        사주 재계산
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
