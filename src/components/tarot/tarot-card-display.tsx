"use client";

/**
 * 타로 카드 시각적 표시 컴포넌트.
 *
 * - 이미지가 있으면 next/image 로 렌더링 (public/tarot/{id}.png)
 * - 이미지 로드 실패 / id 없음 → 텍스트 폴백 카드
 * - 역방향(isReversed) 은 래퍼를 rotate-180 하여 표현
 */

import { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface TarotCardDisplayProps {
  /** cards.ts 의 TarotCard.id (예: "the_fool", "cups_1"). */
  id: string;
  nameKo: string;
  nameEn: string;
  isReversed: boolean;
  className?: string;
}

export function TarotCardDisplay({
  id,
  nameKo,
  nameEn,
  isReversed,
  className,
}: TarotCardDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const src = `/tarot/${id}.png`;

  return (
    <div
      className={cn(
        /* aspect-[2/3] 고정 비율 — 이미지 해상도 차이 무관하게 항상 같은 크기 */
        "relative mx-auto aspect-[2/3] w-44 sm:w-56",
        isReversed && "rotate-180",
        className,
      )}
      aria-label={`${nameKo} ${isReversed ? "거꾸로 선" : "바로 선"}`}
    >
      {!imgError ? (
        <Image
          src={src}
          alt={nameKo}
          fill
          className="object-cover rounded-xl border border-white/20 shadow-[0_22px_60px_rgb(0_0_0/0.22)]"
          onError={() => setImgError(true)}
          sizes="(max-width: 640px) 176px, 224px"
          priority={false}
        />
      ) : (
        <FallbackCard nameKo={nameKo} nameEn={nameEn} />
      )}
    </div>
  );
}

/** 이미지 없을 때 보여주는 텍스트 카드. */
function FallbackCard({
  nameKo,
  nameEn,
}: {
  nameKo: string;
  nameEn: string;
}) {
  return (
    <div
      className={cn(
        "aspect-[2/3] w-full",
        "rounded-xl border border-accent/35",
        "bg-gradient-to-br from-card/95 via-card/80 to-primary/12",
        "flex flex-col items-center justify-between p-4 sm:p-6",
        "shadow-[0_22px_60px_rgb(0_0_0/0.16)] backdrop-blur",
      )}
    >
      <Sparkles className="h-5 w-5 text-accent self-start" aria-hidden />
      <div className="text-center space-y-2">
        <p className="font-mystic text-base sm:text-lg font-semibold leading-tight">
          {nameKo}
        </p>
        <p className="text-xs text-muted-foreground tracking-wide">{nameEn}</p>
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
 * 카드 자체가 회전되어 있으므로 별도 텍스트로 표시.
 */
export function CardOrientationBadge({
  isReversed,
}: {
  isReversed: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shadow-sm",
        isReversed
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-primary/60 bg-primary text-primary-foreground",
      )}
    >
      {isReversed ? "거꾸로 선 카드" : "바로 선 카드"}
    </span>
  );
}
