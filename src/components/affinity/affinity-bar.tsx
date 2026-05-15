"use client";

/**
 * 캐릭터 친밀도 표시 바.
 * 레벨 호칭 + 포인트 진행 바를 보여준다.
 */
import { cn } from "@/lib/utils";
import { calcLevel } from "@/lib/affinity/levels";
import type { CharacterId } from "@/lib/chat/characters";

interface AffinityBarProps {
  characterId: CharacterId;
  points: number;
  /** 작은 크기 (캐릭터 선택 카드 내부용) */
  compact?: boolean;
}

/** 캐릭터별 진행 바 색상 */
const BAR_COLOR: Record<CharacterId, string> = {
  child:      "bg-red-500",
  witch:      "bg-blue-500",
  sage:       "bg-amber-500",
  shaman:     "bg-rose-500",
  taoist:     "bg-cyan-500",
  dokkaebi:   "bg-purple-500",
  hunter:     "bg-stone-500",
  runeshaman: "bg-indigo-500",
  god:        "bg-sky-400",
};

export function AffinityBar({ characterId, points, compact = false }: AffinityBarProps) {
  const { level, label, minPoints, nextPoints } = calcLevel(characterId, points);
  const isMax = nextPoints === null;

  const progress = isMax
    ? 100
    : Math.min(100, Math.round(((points - minPoints) / (nextPoints - minPoints)) * 100));

  const barColor = BAR_COLOR[characterId];

  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-muted-foreground">Lv.{level} {label}</span>
          <span className="text-[15px] text-muted-foreground tabular-nums">
            {points}{nextPoints != null ? `/${nextPoints}` : ""}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-[15px] font-semibold text-muted-foreground">
            Lv.{level}
          </span>
          <span className="text-[15px] text-foreground/70">{label}</span>
        </div>
        <span className="text-[15px] text-muted-foreground tabular-nums">
          {isMax ? "최대" : `${points} / ${nextPoints}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
