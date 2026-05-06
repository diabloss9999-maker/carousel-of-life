"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface GlobalErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({
  error,
  reset,
}: GlobalErrorBoundaryProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalErrorBoundary]", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight">
          별의 흐름이 잠시 흐려졌어요
        </h1>
        <p className="text-sm text-muted-foreground">
          예기치 못한 오류가 발생했어요. 다시 시도해주세요.
        </p>
        {error.digest ? (
          <code className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
            {error.digest}
          </code>
        ) : null}
        <Button onClick={reset} size="lg">
          <RefreshCw className="h-4 w-4" aria-hidden />
          다시 시도
        </Button>
      </div>
    </main>
  );
}
