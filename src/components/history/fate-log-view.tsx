"use client";

/**
 * 운명 로그 뷰.
 * 타임라인 형식으로 사용자의 흔적을 세계관 언어로 표현한다.
 */
import { useState } from "react";
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { FateLogEntry, FateSummary } from "@/lib/history/fate-log";
import type { CrackLevel } from "@/lib/crack/service";
import { cn } from "@/lib/utils";

interface FateLogViewProps {
  entries: FateLogEntry[];
  summary: FateSummary;
  crackLevel: CrackLevel;
}

/** 로그 타입별 아이콘 */
const TYPE_SYMBOL: Record<string, string> = {
  fortune:      "◈",
  tarot:        "◇",
  rune:         "ᚠ",
  lenormand:    "◉",
  compatibility:"◎",
  mood:         "·",
  affinity:     "▲",
  crack:        "▓",
};

const TYPE_COLOR: Record<string, string> = {
  fortune:      "text-amber-400/80",
  tarot:        "text-violet-400/80",
  rune:         "text-cyan-400/80",
  lenormand:    "text-rose-400/80",
  compatibility:"text-pink-400/80",
  mood:         "text-muted-foreground/60",
  affinity:     "text-emerald-400/80",
  crack:        "text-red-400/60",
};

const CRACK_KEY: Record<CrackLevel, "stable" | "wave" | "fracture" | "danger" | "imminent"> = {
  0: "stable",
  1: "wave",
  2: "fracture",
  3: "danger",
  4: "imminent",
};

const MOOD_SYMBOL: Record<string, string> = {
  great: "✦", good: "○", neutral: "—", tough: "△", hard: "▼",
};

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function FateLogView({ entries, summary, crackLevel }: FateLogViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const t = useTranslations("historyPage");
  const tCrack = useTranslations("crackLabelsFull");
  const tMood = useTranslations("moodLabels");
  const locale = useLocale();

  const crackLabel = tCrack(CRACK_KEY[crackLevel]);
  const moodLabel = (key: string): string => {
    try {
      return tMood(key as "great" | "good" | "neutral" | "tough" | "hard");
    } catch {
      return key;
    }
  };

  return (
    <div className="space-y-6">
      {/* 내 서사 — 요약 카드 */}
      <div
        className="rounded-2xl border border-white/15 p-5 space-y-5"
        style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground/70">{t("myStory")}</p>

        {/* 핵심 숫자 — 가장 크게 */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <StatCell label={t("crackStatus")} value={crackLabel}
            dim={crackLevel === 0}
            accent={crackLevel >= 3 ? "text-red-400" : crackLevel >= 2 ? "text-amber-400" : undefined}
          />
          {summary.narrative.totalDaysVisited > 0 && (
            <StatCell label={t("daysVisited")} value={t("daysCount", { n: summary.narrative.totalDaysVisited })} />
          )}
          {summary.narrative.totalCardsDrawn > 0 && (
            <StatCell label={t("cardsDrawn")} value={t("cardsCount", { n: summary.narrative.totalCardsDrawn })} />
          )}
          {summary.mostCalledCharacter && (
            <StatCell
              label={t("mostMet")}
              value={summary.mostCalledCharacterCount > 0
                ? t("mostMetWithCount", { name: summary.mostCalledCharacter, n: summary.mostCalledCharacterCount })
                : summary.mostCalledCharacter}
            />
          )}
          {summary.dominantMood && (
            <StatCell
              label={t("dominantMood")}
              value={`${MOOD_SYMBOL[summary.dominantMood] ?? "·"} ${moodLabel(summary.dominantMood)}`}
            />
          )}
        </div>

        {/* 반복 패턴 */}
        {summary.narrative.repeatedCard && (
          <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
            <p className="text-xs text-muted-foreground/70 tracking-widest mb-1">{t("repeatedDetected")}</p>
            <p className="text-sm text-muted-foreground/70 font-mystic italic">
              {t("repeatedCardLine", {
                card: summary.narrative.repeatedCard,
                n: summary.narrative.repeatedCardCount,
              })}
            </p>
          </div>
        )}

        {/* 캐릭터 조우 현황 */}
        {summary.narrative.characterCounts.length > 0 && (
          <div className="space-y-2 border-t border-white/5 pt-4">
            <p className="text-xs text-muted-foreground/70 tracking-widest">{t("encounter")}</p>
            <div className="flex flex-wrap gap-2">
              {summary.narrative.characterCounts.map(({ name, count: cnt }) => (
                <span key={name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground/85">
                  {t("encounterCount", { name, n: cnt })}
                </span>
              ))}
            </div>
          </div>
        )}

        {summary.patterns.length > 0 && (
          <div className="border-t border-white/5 pt-3 space-y-1">
            <p className="text-xs text-muted-foreground/70 tracking-widest">{t("patternsDetected")}</p>
            {summary.patterns.map((p, i) => (
              <p key={i} className="text-xs text-muted-foreground/70 font-mystic italic">{p}</p>
            ))}
          </div>
        )}

        {/* 오늘의 경계 공유 버튼 */}
        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/65 tracking-widest">{t("todayBoundaryCard")}</p>
          <button
            type="button"
            onClick={async () => {
              const today = new Date().toLocaleDateString(
                locale === "en" ? "en-US" : "ko-KR",
              );
              const params = new URLSearchParams({
                mood:  summary.dominantMood ?? "neutral",
                char:  summary.mostCalledCharacter ?? "",
                crack: String(crackLevel),
                date:  today,
                locale,
                ...(summary.patterns[0] ? { pattern: summary.patterns[0] } : {}),
              });
              const url = `/api/share/boundary?${params}`;
              const res = await fetch(url);
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = t("boundaryFilename", { date: today });
              a.click();
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground/75 hover:text-muted-foreground/95 transition-colors"
          >
            <Download className="h-3 w-3" />
            {t("downloadSave")}
          </button>
        </div>
      </div>

      {/* 타임라인 */}
      {entries.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="font-mystic text-muted-foreground/80 text-base">{t("emptyTitle")}</p>
          <p className="text-xs text-muted-foreground/65">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* 세로선 */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

          {entries.map((entry) => {
            const symbol = TYPE_SYMBOL[entry.type] ?? "·";
            const color = TYPE_COLOR[entry.type] ?? "text-muted-foreground/50";
            const isOpen = expanded === entry.id;

            return (
              <div key={entry.id} className="relative flex gap-4 py-2">
                {/* 심볼 */}
                <div className={cn("w-9 flex-shrink-0 flex items-start justify-center pt-1", color)}>
                  <span className="text-sm font-bold">{symbol}</span>
                </div>

                {/* 내용 */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  className="flex-1 text-left space-y-0.5 group"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn(
                      "font-mystic text-sm leading-snug transition-colors",
                      isOpen ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/90",
                    )}>
                      {entry.title}
                    </p>
                    <span className="text-xs text-muted-foreground/65 flex-shrink-0 tabular-nums">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  {entry.detail && (
                    <p className="text-xs text-muted-foreground/70">{entry.detail}</p>
                  )}
                  {isOpen && (
                    <p className="text-xs text-muted-foreground/60 font-mystic italic pt-1 border-t border-white/5 mt-1">
                      {entry.significance}
                    </p>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  dim = false,
  accent,
}: {
  label: string;
  value: string;
  dim?: boolean;
  accent?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <p className={cn(
        "font-mystic text-sm font-semibold",
        accent ?? (dim ? "text-muted-foreground/65" : "text-foreground/90"),
      )}>
        {value}
      </p>
    </div>
  );
}
