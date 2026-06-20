"use client";

import { useState } from "react";

import { TarotDrawForm } from "@/components/tarot/tarot-draw-form";
import { TarotThreeForm } from "@/components/tarot/tarot-three-form";
import type { TarotReader } from "@/components/tarot/reader";
import { cn } from "@/lib/utils";

type TarotMode = "single" | "three";

interface TarotModeSwitchProps {
  oneCardReader: TarotReader;
  threeCardReader: TarotReader;
  subscribed: boolean;
}

export function TarotModeSwitch({
  oneCardReader,
  threeCardReader,
  subscribed,
}: TarotModeSwitchProps) {
  const [mode, setMode] = useState<TarotMode>("single");

  return (
    <div className="space-y-4">
      <div className="mx-auto grid max-w-md grid-cols-2 rounded-2xl border border-white/15 bg-white/[0.08] p-1 backdrop-blur-xl">
        <ModeButton
          active={mode === "single"}
          label="한 장"
          onClick={() => setMode("single")}
        />
        <ModeButton
          active={mode === "three"}
          label="3장"
          badge={subscribed ? undefined : "라이트"}
          onClick={() => setMode("three")}
        />
      </div>

      {mode === "single" ? (
        <TarotDrawForm reader={oneCardReader} />
      ) : (
        <TarotThreeForm reader={threeCardReader} subscribed={subscribed} />
      )}
    </div>
  );
}

function ModeButton({
  active,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-[15px] font-semibold transition",
        active
          ? "bg-white text-black shadow-sm"
          : "text-foreground/75 hover:bg-white/10 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {badge ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
            active ? "bg-black/10 text-black" : "bg-white/15 text-foreground/70",
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
