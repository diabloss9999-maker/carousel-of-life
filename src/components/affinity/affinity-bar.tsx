"use client";

/**
 * 멤버 친밀도 표시 바.
 * 레벨 + 포인트 진행 바를 보여준다.
 */
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { calcLevel } from "@/lib/affinity/levels";
import { nextAffinityReward } from "@/lib/affinity/rewards";
import type { CharacterId } from "@/lib/chat/characters";

interface AffinityBarProps {
  characterId: CharacterId;
  points: number;
  /** 작은 크기 (멤버 선택 카드 내부용) */
  compact?: boolean;
}

/** 멤버별 진행 바 색상 */
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
  const t = useTranslations("affinityBar");
  const { level, minPoints, nextPoints } = calcLevel(characterId, points);
  const isMax = nextPoints === null;

  const progress = isMax
    ? 100
    : Math.min(100, Math.round(((points - minPoints) / (nextPoints - minPoints)) * 100));

  const barColor = BAR_COLOR[characterId];
  const nextReward = nextAffinityReward(level);

  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between gap-1.5">
          {/* min-w-0 + truncate: 좁은 카드에서 라벨이 글자 단위로 깨지는 것 방지 */}
          <span className="min-w-0 flex-1 truncate text-[15px] text-muted-foreground">
            Lv.{level}
          </span>
          <span className="shrink-0 whitespace-nowrap text-[15px] text-muted-foreground tabular-nums">
            {points}
            {nextPoints != null ? `/${nextPoints}` : ""}
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
        </div>
        <span className="text-[15px] text-muted-foreground tabular-nums">
          {isMax ? t("max") : `${points} / ${nextPoints}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${progress}%` }}
        />
      </div>
      {nextReward ? (
        <p className="text-[13px] text-muted-foreground/70">
          {t("nextPrefix", { level: nextReward.level })}{" "}
          <span className="text-foreground/75">{t(`reward${nextReward.level}`)}</span>{" "}
          {t("unlock")}
        </p>
      ) : null}
    </div>
  );
}
