"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const t = useTranslations("cancelSubscription");

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? t("errorGeneric"));
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
        {t("title")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        {t("body")}
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
          {t("confirm")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          {t("abort")}
        </Button>
      </div>
    </div>
  );
}
