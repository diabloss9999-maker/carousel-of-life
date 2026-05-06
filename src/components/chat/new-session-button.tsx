"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

interface NewSessionButtonProps extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode;
}

export function NewSessionButton({
  children,
  variant = "default",
  size = "default",
  className,
  ...props
}: NewSessionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", { method: "POST" });
      if (!res.ok) return;
      const json = (await res.json()) as
        | { ok: true; data: { sessionId: string } }
        | { ok: false; error: { message: string } };
      if (json.ok) {
        router.push(`/chat/${json.data.sessionId}` as Route);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
      onClick={handleClick}
      {...props}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Plus className="h-4 w-4" aria-hidden />
      )}
      {children ?? "새 대화"}
    </Button>
  );
}
