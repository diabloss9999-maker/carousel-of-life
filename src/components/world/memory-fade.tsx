/**
 * 기억 손실 연출 래퍼.
 *
 * - faded: 약한 opacity + blur, hover 시 선명해짐
 * - redacted: 텍스트가 가려진 듯 보이게 (실제 데이터 변경 없음, CSS only)
 * - normal: 일반 표시
 */
import type { ReactNode } from "react";

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
  if (variant === "faded") {
    return <span className={cn("memory-faded", className)}>{children}</span>;
  }
  if (variant === "redacted") {
    return (
      <span
        className={cn("memory-redacted", className)}
        aria-label="기록 손실"
      >
        {children}
      </span>
    );
  }
  return <>{children}</>;
}
