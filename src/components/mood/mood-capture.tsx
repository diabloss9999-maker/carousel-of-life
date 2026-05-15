"use client";

/**
 * 감정 기록 위젯.
 * 운세/타로 결과 하단에 붙어서 1탭으로 오늘 기분을 남긴다.
 * 하루에 한 번만 표시 (이미 기록됐으면 숨김).
 */
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { saveMoodAction } from "@/app/(dashboard)/today/mood-actions";

const MOOD_KEYS = ["great", "good", "neutral", "tough", "hard"] as const;
const MOOD_SYMBOL: Record<(typeof MOOD_KEYS)[number], string> = {
  great:   "✦",
  good:    "○",
  neutral: "—",
  tough:   "△",
  hard:    "▼",
};

type MoodKey = (typeof MOOD_KEYS)[number];

interface MoodCaptureProps {
  /** 오늘 이미 기록된 기분 (있으면 완료 상태로 표시) */
  todayMood?: string | null;
  source?: string;
}

export function MoodCapture({ todayMood, source = "fortune" }: MoodCaptureProps) {
  const t = useTranslations("today");
  const tMood = useTranslations("moods");
  const [selected, setSelected] = useState<MoodKey | null>(
    (todayMood as MoodKey) ?? null,
  );
  const [done, setDone] = useState(!!todayMood);
  const [isPending, startTransition] = useTransition();

  function handleSelect(key: MoodKey) {
    if (done || isPending) return;
    setSelected(key);
    startTransition(async () => {
      await saveMoodAction({ mood: key, source });
      setDone(true);
    });
  }

  return (
    <div className="rounded-xl border border-border/20 bg-muted/10 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground/60 tracking-wide">
          {t("moodPrompt")}
        </p>
        {done && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <Check className="h-3 w-3" />
            {t("moodSaved")}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {MOOD_KEYS.map((key) => {
          const symbol = MOOD_SYMBOL[key];
          const label = tMood(key);
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={done || isPending}
              onClick={() => handleSelect(key)}
              title={label}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-2 text-center transition-all",
                "disabled:cursor-default",
                isSelected
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : done
                    ? "border-border/20 text-muted-foreground/45"
                    : "border-border/30 text-muted-foreground/75 hover:border-border/50 hover:text-foreground/90",
              )}
            >
              <span className="text-sm font-bold leading-none">{symbol}</span>
              <span className="text-xs leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
