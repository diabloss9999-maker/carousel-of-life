"use client";

/**
 * 단순 native select 래퍼.
 *
 * Radix Select 는 스타일링이 까다로워 MVP 에서는 native select 로 시작한다.
 * 향후 커스텀 디자인이 필요하면 Radix Select 로 교체.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-input/80 bg-card/55 px-3.5 py-2 pr-10 text-base shadow-sm ring-offset-background backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
});
Select.displayName = "Select";

export { Select };
