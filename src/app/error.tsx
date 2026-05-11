"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface GlobalErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({
  error,
  reset,
}: GlobalErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalErrorBoundary]", error);
    }
  }, [error]);

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg,#1a1025 0%,#0d0818 60%)" }}
    >
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight text-foreground">
          별의 흐름이 잠시 흐려졌어요
        </h1>
        <p className="text-sm text-muted-foreground">
          예기치 못한 오류가 발생했어요.
        </p>
        {error.digest ? (
          <code className="rounded-md bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            {error.digest}
          </code>
        ) : null}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button size="lg" onClick={() => router.push("/today")} className="w-full">
            <Home className="h-4 w-4" aria-hidden />
            홈으로 돌아가기
          </Button>
          <Button size="lg" variant="outline" onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4" aria-hidden />
            다시 시도
          </Button>
        </div>
      </div>
    </main>
  );
}
