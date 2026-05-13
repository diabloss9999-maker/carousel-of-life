import { crackLabel, crackToPercent } from "@/lib/world/crack-percent";

interface WorldStatusPanelProps {
  /** 사용자의 현재 크랙 레벨 (0~4). */
  crackLevel: number;
}

/**
 * 오늘의 세계 상태(경계 균열 측정 패널).
 *
 * - %, 라벨, 진행 바, 분위기 한 줄을 함께 표시한다.
 * - 게임화 금지 원칙에 따라 점수/레벨 자체는 노출하지 않는다.
 */
export function WorldStatusPanel({ crackLevel }: WorldStatusPanelProps) {
  const percent = crackToPercent(crackLevel);
  const label = crackLabel(crackLevel);
  const isHigh = crackLevel >= 3;

  return (
    <div className="app-surface rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            경계 균열 측정
          </p>
          <p className="font-mystic text-sm font-semibold text-foreground">
            오늘의 세계 상태
          </p>
        </div>
        <div className="text-right">
          <p
            className={`font-mystic text-2xl font-bold tabular-nums ${
              isHigh ? "text-destructive" : "text-foreground"
            }`}
          >
            {percent}%
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
        </div>
      </div>

      {/* 균열 진행 바 */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-all duration-700 ${
            crackLevel >= 3
              ? "bg-red-500/70"
              : crackLevel >= 2
                ? "bg-amber-500/70"
                : "bg-emerald-500/60"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed font-mystic italic">
        {crackLevel >= 3
          ? "관측 신호가 흐려지고 있습니다. 흐름이 안정적이지 않아요."
          : crackLevel >= 2
            ? "경계가 평소보다 얇아져 있습니다."
            : "관측소는 평온하게 작동 중입니다."}
      </p>
    </div>
  );
}
