/**
 * 기억 손실 연출 래퍼.
 */
"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface MemoryFadeProps {
  children: ReactNode;
  variant?: "faded" | "redacted" | "normal";
  className?: string;
}

export function MemoryFade({
  children,
  variant = "normal",
  className,
}: MemoryFadeProps) {
  const t = useTranslations("worldAtmosphere");
  if (variant === "faded") {
    return <span className={cn("memory-faded", className)}>{children}</span>;
  }
  if (variant === "redacted") {
    return (
      <span
        className={cn("memory-redacted", className)}
        aria-label={t("memoryLoss")}
      >
        {children}
      </span>
    );
  }
  return <>{children}</>;
}
