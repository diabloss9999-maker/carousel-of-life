"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("appShell");

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
          {t("errorTitle")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("errorBody")}
        </p>
        {error.digest ? (
          <code className="rounded-md bg-muted/30 px-3 py-1 text-[15px] text-muted-foreground">
            {error.digest}
          </code>
        ) : null}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button size="lg" onClick={() => router.push("/today")} className="w-full">
            <Home className="h-4 w-4" aria-hidden />
            {t("errorHome")}
          </Button>
          <Button size="lg" variant="outline" onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("errorRetry")}
          </Button>
        </div>
      </div>
    </main>
  );
}
