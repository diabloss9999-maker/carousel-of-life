/**
 * 운세 카드 내부의 행운 정보(색·수·방향)를 시각적으로 표현하는 컴포넌트.
 * 텍스트 한 줄 대신 3등분 아이콘 카드로 노출한다.
 */
"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

/** 한글 색 이름 → CSS 색상 매핑. 매칭 실패 시 회색 fallback. */
const COLOR_MAP: Record<string, string> = {
  빨간색: "#FF4444",
  빨강: "#FF4444",
  주황색: "#FF9933",
  주황: "#FF9933",
  노란색: "#FFD93D",
  노랑: "#FFD93D",
  연두색: "#90EE90",
  연두: "#90EE90",
  초록색: "#22C55E",
  초록: "#22C55E",
  녹색: "#22C55E",
  청록색: "#14B8A6",
  청록: "#14B8A6",
  하늘색: "#87CEEB",
  하늘: "#87CEEB",
  파란색: "#4488FF",
  파랑: "#4488FF",
  남색: "#1E3A8A",
  보라색: "#A855F7",
  보라: "#A855F7",
  자주색: "#9333EA",
  분홍색: "#FF8FB1",
  분홍: "#FF8FB1",
  핑크: "#FF8FB1",
  갈색: "#92400E",
  검정색: "#1F2937",
  검정: "#1F2937",
  흰색: "#F9FAFB",
  하양: "#F9FAFB",
  회색: "#9CA3AF",
  은색: "#C0C0C0",
  금색: "#FFD700",
  황금색: "#FFD700",
};

const FALLBACK_COLOR = "#9CA3AF";

/**
 * 한글 색 이름에서 CSS 색상을 추론한다. 정확 매칭 → 부분 매칭 → fallback 순.
 */
function resolveColor(name: string | null | undefined): string {
  if (!name) return FALLBACK_COLOR;
  const trimmed = name.trim();
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];
  // 부분 매칭: "은은한 연두" 같은 표현 대응.
  for (const key of Object.keys(COLOR_MAP)) {
    if (trimmed.includes(key)) return COLOR_MAP[key];
  }
  return FALLBACK_COLOR;
}

/** 한글 방향 이름 → 회전 각도(deg). 0deg = 위(북). */
const DIRECTION_ROTATION: Record<string, number> = {
  북: 0,
  북쪽: 0,
  북동: 45,
  북동쪽: 45,
  동: 90,
  동쪽: 90,
  남동: 135,
  남동쪽: 135,
  남: 180,
  남쪽: 180,
  남서: 225,
  남서쪽: 225,
  서: 270,
  서쪽: 270,
  북서: 315,
  북서쪽: 315,
};

/**
 * 한글 방향에서 회전 각도를 추론한다. 매칭 실패 시 null (화살표 미표시).
 */
function resolveDirectionRotation(name: string | null | undefined): number | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed in DIRECTION_ROTATION) return DIRECTION_ROTATION[trimmed];
  for (const key of Object.keys(DIRECTION_ROTATION)) {
    if (trimmed.includes(key)) return DIRECTION_ROTATION[key];
  }
  return null;
}

interface LuckyInfoProps {
  color: string | null;
  number: number | null;
  direction: string | null;
}

export function LuckyInfo({ color, number, direction }: LuckyInfoProps) {
  const t = useTranslations("fortuneCard");
  const colorHex = resolveColor(color);
  const rotation = resolveDirectionRotation(direction);

  return (
    <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-4 sm:gap-3">
      {/* 행운의 색 */}
      <LuckyTile label={t("luckyColor")}>
        <span
          className="inline-block h-8 w-8 rounded-full border border-border/60 shadow-inner sm:h-10 sm:w-10"
          style={{ backgroundColor: colorHex }}
          aria-hidden="true"
        />
        <span className="font-mystic text-sm font-semibold text-foreground/90 sm:text-base">
          {color ?? "—"}
        </span>
      </LuckyTile>

      {/* 행운의 수 */}
      <LuckyTile label={t("luckyNumber")}>
        <span
          className="font-mystic bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-3xl font-bold text-transparent drop-shadow-sm sm:text-4xl"
          aria-hidden="true"
        >
          {number ?? "—"}
        </span>
        <span className="sr-only">{number ?? "—"}</span>
      </LuckyTile>

      {/* 행운의 방향 */}
      <LuckyTile label={t("luckyDirection")}>
        {rotation !== null ? (
          <ArrowUp
            className="h-7 w-7 text-primary sm:h-9 sm:w-9"
            style={{ transform: `rotate(${rotation}deg)` }}
            aria-hidden="true"
          />
        ) : (
          <span className="text-2xl text-muted-foreground" aria-hidden="true">
            —
          </span>
        )}
        <span className="font-mystic text-sm font-semibold text-foreground/90 sm:text-base">
          {direction ?? "—"}
        </span>
      </LuckyTile>
    </div>
  );
}

interface LuckyTileProps {
  label: string;
  children: React.ReactNode;
}

function LuckyTile({ label, children }: LuckyTileProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 p-3 text-center sm:p-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
        {children}
      </div>
      <span className="text-xs uppercase tracking-wider text-muted-foreground sm:text-xs">
        {label}
      </span>
    </div>
  );
}
