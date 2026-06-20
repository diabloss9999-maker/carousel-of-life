"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";

interface TarotCardDisplayProps {
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
  const src = `/tarot/${id}.webp`;
  const locale = useLocale();
  const displayName = locale === "en" && nameEn ? nameEn : nameKo;
  const ariaLabel = `${displayName} ${isReversed ? "역방향" : "정방향"}`;

  return (
    <div
      className={cn(
        "relative mx-auto aspect-[2/3] w-44 sm:w-56",
        isReversed && "rotate-180",
        className,
      )}
      aria-label={ariaLabel}
    >
      {!imgError ? (
        <Image
          src={src}
          alt={displayName}
          fill
          className="rounded-xl border border-white/20 object-cover shadow-[0_22px_60px_rgb(0_0_0/0.22)]"
          onError={() => setImgError(true)}
          sizes="(max-width: 640px) 176px, 224px"
          priority={false}
        />
      ) : (
        <FallbackCard
          primary={displayName}
          secondary={locale === "en" ? nameKo : nameEn}
        />
      )}
    </div>
  );
}

function FallbackCard({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[2/3] w-full flex-col items-center justify-between",
        "rounded-xl border border-accent/35",
        "bg-gradient-to-br from-card/95 via-card/80 to-primary/12",
        "p-4 shadow-[0_22px_60px_rgb(0_0_0/0.16)] backdrop-blur sm:p-6",
      )}
    >
      <Sparkles className="self-start h-5 w-5 text-accent" aria-hidden />
      <div className="space-y-2 text-center">
        <p className="font-mystic text-base font-semibold leading-tight sm:text-lg">
          {primary}
        </p>
        <p className="text-[15px] tracking-wide text-muted-foreground">
          {secondary}
        </p>
      </div>
      <Sparkles
        className="self-end h-5 w-5 rotate-180 text-accent"
        aria-hidden
      />
    </div>
  );
}

export function CardOrientationBadge({
  isReversed,
}: {
  isReversed: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[15px] font-medium shadow-sm",
        isReversed
          ? "border-destructive bg-destructive text-white"
          : "border-primary/60 bg-primary text-primary-foreground",
      )}
    >
      {isReversed ? "역방향" : "정방향"}
    </span>
  );
}
