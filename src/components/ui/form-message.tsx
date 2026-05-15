/**
 * 폼 검증 메시지 표시 컴포넌트.
 */
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type FormMessageState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export const idleFormMessage: FormMessageState = { kind: "idle" };

export function FormMessage({ state }: { state: FormMessageState }) {
  if (state.kind === "idle") return null;

  const Icon = state.kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      role={state.kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-[15px]",
        state.kind === "error"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-accent/40 bg-accent/10 text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
      <span>{state.message}</span>
    </div>
  );
}
