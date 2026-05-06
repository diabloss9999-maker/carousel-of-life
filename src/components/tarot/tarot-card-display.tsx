import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface TarotCardDisplayProps {
  nameKo: string;
  nameEn: string;
  isReversed: boolean;
  className?: string;
}

/**
 * 뽑힌 타로 카드를 시각적으로 표시.
 *
 * MVP: 이미지 없이 카드 모양 + 이름 + 정/역방향 텍스트만.
 * 추후 라이더-웨이트 이미지 연결 가능.
 */
export function TarotCardDisplay({
  nameKo,
  nameEn,
  isReversed,
  className,
}: TarotCardDisplayProps) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-44 sm:w-56 mx-auto",
        "rounded-xl border-2 border-accent/40",
        "bg-gradient-to-br from-card via-card to-primary/10",
        "flex flex-col items-center justify-between p-4 sm:p-6",
        "shadow-lg shadow-primary/10",
        isReversed && "rotate-180",
        className,
      )}
      aria-label={`${nameKo} ${isReversed ? "거꾸로 선" : "바로 선"}`}
    >
      <Sparkles
        className="h-5 w-5 text-accent self-start"
        aria-hidden
      />

      <div className="text-center space-y-2">
        <p className="font-mystic text-base sm:text-lg font-semibold leading-tight">
          {nameKo}
        </p>
        <p className="text-xs text-muted-foreground tracking-wide">
          {nameEn}
        </p>
      </div>

      <Sparkles
        className="h-5 w-5 text-accent self-end rotate-180"
        aria-hidden
      />
    </div>
  );
}

/**
 * 카드 옆에 표시되는 정/역방향 배지.
 * 카드 자체가 회전되어 있으므로 별도 텍스트 표시.
 */
export function CardOrientationBadge({
  isReversed,
}: {
  isReversed: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium",
        isReversed
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-accent/40 bg-accent/15 text-accent-foreground",
      )}
    >
      {isReversed ? "거꾸로 선 카드" : "바로 선 카드"}
    </span>
  );
}
