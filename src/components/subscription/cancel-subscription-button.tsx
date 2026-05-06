"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "취소에 실패했어. 잠시 후 다시 시도해줘.");
        return;
      }
      router.refresh();
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground"
      >
        구독 취소
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        다음 결제일 이후 자동 만료돼. 그 전까지는 그대로 사용할 수 있어.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          그래도 취소
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          그만두기
        </Button>
      </div>
    </div>
  );
}
