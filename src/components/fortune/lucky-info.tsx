"use client";

import { ArrowUp } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  빨강: "#ef4444",
  빨간색: "#ef4444",
  주황: "#f97316",
  주황색: "#f97316",
  노랑: "#facc15",
  노란색: "#facc15",
  연두: "#84cc16",
  연두색: "#84cc16",
  초록: "#22c55e",
  초록색: "#22c55e",
  녹색: "#22c55e",
  청록: "#14b8a6",
  청록색: "#14b8a6",
  하늘: "#38bdf8",
  하늘색: "#38bdf8",
  파랑: "#3b82f6",
  파란색: "#3b82f6",
  남색: "#1e3a8a",
  보라: "#a855f7",
  보라색: "#a855f7",
  자주색: "#9333ea",
  분홍: "#fb7185",
  분홍색: "#fb7185",
  핑크: "#fb7185",
  갈색: "#92400e",
  검정: "#111827",
  검은색: "#111827",
  흰색: "#f9fafb",
  하양: "#f9fafb",
  회색: "#9ca3af",
  은색: "#c0c0c0",
  금색: "#facc15",
  황금색: "#facc15",
};

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

const FALLBACK_COLOR = "#9ca3af";

interface LuckyInfoProps {
  color: string | null;
  number: number | null;
  direction: string | null;
}

export function LuckyInfo({ color, number, direction }: LuckyInfoProps) {
  const colorHex = resolveColor(color);
  const rotation = resolveDirectionRotation(direction);

  return (
    <div className="liquid-lucky-grid grid grid-cols-3 gap-0">
      <LuckyTile label="행운 색">
        <span
          className="liquid-lucky-color inline-block h-9 w-9 rounded-full sm:h-10 sm:w-10"
          style={{ backgroundColor: colorHex }}
          aria-hidden
        />
        <span className="font-mystic text-[15px] font-semibold text-foreground/90">
          {color ?? "-"}
        </span>
      </LuckyTile>

      <LuckyTile label="행운 숫자">
        <span
          className="liquid-lucky-number font-mystic text-3xl font-bold sm:text-4xl"
          aria-hidden
        >
          {number ?? "-"}
        </span>
        <span className="sr-only">{number ?? "-"}</span>
      </LuckyTile>

      <LuckyTile label="행운 방향">
        {rotation !== null ? (
          <ArrowUp
            className="h-8 w-8 text-foreground/85 sm:h-9 sm:w-9"
            style={{ transform: `rotate(${rotation}deg)` }}
            aria-hidden
          />
        ) : (
          <span className="text-2xl text-muted-foreground" aria-hidden>
            -
          </span>
        )}
        <span className="font-mystic text-[15px] font-semibold text-foreground/90">
          {direction ?? "-"}
        </span>
      </LuckyTile>
    </div>
  );
}

function resolveColor(name: string | null | undefined): string {
  if (!name) return FALLBACK_COLOR;
  const trimmed = name.trim();
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed];
  for (const key of Object.keys(COLOR_MAP)) {
    if (trimmed.includes(key)) return COLOR_MAP[key];
  }
  return FALLBACK_COLOR;
}

function resolveDirectionRotation(name: string | null | undefined): number | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed in DIRECTION_ROTATION) return DIRECTION_ROTATION[trimmed];
  for (const key of Object.keys(DIRECTION_ROTATION)) {
    if (trimmed.includes(key)) return DIRECTION_ROTATION[key];
  }
  return null;
}

interface LuckyTileProps {
  label: string;
  children: React.ReactNode;
}

function LuckyTile({ label, children }: LuckyTileProps) {
  return (
    <div className="liquid-lucky-tile flex flex-col items-center justify-between gap-2 px-2 py-3 text-center sm:px-4 sm:py-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
        {children}
      </div>
      <span className="text-[15px] text-muted-foreground">{label}</span>
    </div>
  );
}
