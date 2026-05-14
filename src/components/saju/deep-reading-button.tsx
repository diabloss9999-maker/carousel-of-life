"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("deepReading");

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateDeepReadingAction();
      if (result.kind === "error") {
        setError(result.message ?? t("shortError"));
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

  const lockBullets = t.raw("premiumLockBullets") as string[];

  if (locked) {
    return (
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-accent" aria-hidden />
            <CardTitle className="font-mystic text-xl">
              {t("premiumTitle")}
            </CardTitle>
          </div>
          <CardDescription>
            {t("premiumBody")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {lockBullets.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
          <Button asChild className="w-full" size="lg">
            <Link href={ROUTES.pricing}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t("solveCta")}
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
            {t("noneTitle")}
          </CardTitle>
        </div>
        <CardDescription>
          {t("noneBody")}
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
              {t("loading")}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t("getCta")}
            </>
          )}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
