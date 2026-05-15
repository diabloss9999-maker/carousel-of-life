import { useTranslations } from "next-intl";

import { crackLabel, crackToPercent } from "@/lib/world/crack-percent";

interface WorldStatusPanelProps {
  /** 사용자의 현재 크랙 점수 (0~100). */
  crackScore: number;
  /** 사용자의 현재 크랙 레벨 (0~4) — 색상 분기에 사용. */
  crackLevel: number;
}

/** crackLabel(level)의 한국어 결과를 i18n 키로 매핑. */
const LABEL_TO_KEY: Record<ReturnType<typeof crackLabel>, string> = {
  안정: "stable",
  파동: "wave",
  균열: "fracture",
  위험: "danger",
  임박: "imminent",
};

/**
 * 오늘의 세계 상태(경계 균열 측정 패널).
 *
 * - %, 라벨, 진행 바, 분위기 한 줄을 함께 표시한다.
 * - 게임화 금지 원칙에 따라 점수/레벨 자체는 노출하지 않는다.
 */
export function WorldStatusPanel({ crackScore, crackLevel }: WorldStatusPanelProps) {
  const t = useTranslations("today");
  const tLabels = useTranslations("crackLabels");
  const percent = crackToPercent(crackScore);
  const labelKey = LABEL_TO_KEY[crackLabel(crackLevel)] ?? "stable";
  const label = tLabels(labelKey);
  const isHigh = crackLevel >= 3;

  return (
    <div className="app-surface rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[15px] uppercase tracking-widest text-muted-foreground">
            {t("worldStatusLabel")}
          </p>
          <p className="font-mystic text-[15px] font-semibold text-foreground">
            {t("worldStatusTitle")}
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
          <p className="text-[15px] uppercase tracking-widest text-muted-foreground">
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

      <PanelMessage crackLevel={crackLevel} />
    </div>
  );
}

function PanelMessage({ crackLevel }: { crackLevel: number }) {
  const t = useTranslations("worldAtmosphere");
  const msg =
    crackLevel >= 3 ? t("panelDangerMsg")
    : crackLevel >= 2 ? t("panelFractureMsg")
    : t("panelStableMsg");
  return (
    <p className="text-[15px] text-muted-foreground leading-relaxed font-mystic italic">
      {msg}
    </p>
  );
}
