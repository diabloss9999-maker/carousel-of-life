"use client";

/**
 * 운명 로그 뷰.
 * 타임라인 형식으로 사용자의 흔적을 세계관 언어로 표현한다.
 */
import { useState } from "react";
import { Download } from "lucide-react";
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

const CRACK_LABEL: Record<CrackLevel, string> = {
  0: "안정",
  1: "파동 감지",
  2: "균열 확장",
  3: "위험",
  4: "임박",
};

const MOOD_SYMBOL: Record<string, string> = {
  great: "✦", good: "○", neutral: "—", tough: "△", hard: "▼",
};
const MOOD_LABEL: Record<string, string> = {
  great: "최고야", good: "좋아", neutral: "그냥", tough: "힘드네", hard: "힘들어",
};

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function FateLogView({ entries, summary, crackLevel }: FateLogViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 내 서사 — 요약 카드 */}
      <div
        className="rounded-2xl border border-white/8 p-5 space-y-5"
        style={{ background: "linear-gradient(135deg, #0a0812, #120e1e)" }}
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">나의 서사</p>

        {/* 핵심 숫자 — 가장 크게 */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <StatCell label="균열 상태" value={CRACK_LABEL[crackLevel]}
            dim={crackLevel === 0}
            accent={crackLevel >= 3 ? "text-red-400" : crackLevel >= 2 ? "text-amber-400" : undefined}
          />
          {summary.narrative.totalDaysVisited > 0 && (
            <StatCell label="기록한 날" value={`${summary.narrative.totalDaysVisited}일`} />
          )}
          {summary.narrative.totalCardsDrawn > 0 && (
            <StatCell label="뽑은 카드" value={`${summary.narrative.totalCardsDrawn}장`} />
          )}
          {summary.mostCalledCharacter && (
            <StatCell
              label="가장 많이 만난"
              value={`${summary.mostCalledCharacter} ${summary.mostCalledCharacterCount > 0 ? `(${summary.mostCalledCharacterCount}회)` : ""}`}
            />
          )}
          {summary.dominantMood && (
            <StatCell
              label="지배적 감정"
              value={`${MOOD_SYMBOL[summary.dominantMood] ?? "·"} ${MOOD_LABEL[summary.dominantMood] ?? summary.dominantMood}`}
            />
          )}
        </div>

        {/* 반복 패턴 */}
        {summary.narrative.repeatedCard && (
          <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
            <p className="text-[10px] text-muted-foreground/40 tracking-widest mb-1">반복 감지</p>
            <p className="text-sm text-muted-foreground/70 font-mystic italic">
              '{summary.narrative.repeatedCard}' 카드가 {summary.narrative.repeatedCardCount}번 등장했어.
            </p>
          </div>
        )}

        {/* 캐릭터 조우 현황 */}
        {summary.narrative.characterCounts.length > 0 && (
          <div className="space-y-2 border-t border-white/5 pt-4">
            <p className="text-[10px] text-muted-foreground/40 tracking-widest">조우 기록</p>
            <div className="flex flex-wrap gap-2">
              {summary.narrative.characterCounts.map(({ name, count: cnt }) => (
                <span key={name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted-foreground/60">
                  {name} {cnt}회
                </span>
              ))}
            </div>
          </div>
        )}

        {summary.patterns.length > 0 && (
          <div className="border-t border-white/5 pt-3 space-y-1">
            <p className="text-[10px] text-muted-foreground/40 tracking-widest">패턴 감지</p>
            {summary.patterns.map((p, i) => (
              <p key={i} className="text-xs text-muted-foreground/70 font-mystic italic">{p}</p>
            ))}
          </div>
        )}

        {/* 오늘의 경계 공유 버튼 */}
        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/30 tracking-widest">오늘의 경계 카드</p>
          <button
            type="button"
            onClick={async () => {
              const today = new Date().toLocaleDateString("ko-KR");
              const params = new URLSearchParams({
                mood:  summary.dominantMood ?? "neutral",
                char:  summary.mostCalledCharacter ?? "주술사",
                crack: String(crackLevel),
                date:  today,
                ...(summary.patterns[0] ? { pattern: summary.patterns[0] } : {}),
              });
              const url = `/api/share/boundary?${params}`;
              const res = await fetch(url);
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `경계카드_${today}.png`;
              a.click();
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
          >
            <Download className="h-3 w-3" />
            저장
          </button>
        </div>
      </div>

      {/* 타임라인 */}
      {entries.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="font-mystic text-muted-foreground/50 text-base">아직 흔적이 없어.</p>
          <p className="text-xs text-muted-foreground/30">운세를 보거나 주술사와 대화하면 여기에 쌓여.</p>
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
                    <span className="text-[10px] text-muted-foreground/30 flex-shrink-0 tabular-nums">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  {entry.detail && (
                    <p className="text-[11px] text-muted-foreground/40">{entry.detail}</p>
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
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40">{label}</p>
      <p className={cn(
        "font-mystic text-sm font-semibold",
        accent ?? (dim ? "text-muted-foreground/40" : "text-foreground/80"),
      )}>
        {value}
      </p>
    </div>
  );
}
