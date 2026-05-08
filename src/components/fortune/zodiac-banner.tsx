/**
 * 별자리 · 12간지 카드 배너 — 운세 페이지 상단에 표시.
 * 해당 카테고리일 때만 렌더링.
 */
import Image from "next/image";

import {
  getZodiacSign,
  getChineseZodiac,
} from "@/lib/fortunes/zodiac";

interface ZodiacBannerProps {
  category: string;
  birthDate: string | null;
}

export function ZodiacBanner({ category, birthDate }: ZodiacBannerProps) {
  if (!birthDate) return null;

  if (category === "zodiac") {
    const z = getZodiacSign(birthDate);
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image
            src={`/zodiac/${z.id}.png`}
            alt={z.ko}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="text-center space-y-0.5">
          <p className="font-mystic text-lg font-semibold">
            {z.emoji} {z.ko}
          </p>
          <p className="text-xs text-muted-foreground">{z.en}</p>
        </div>
      </div>
    );
  }

  if (category === "chinese_zodiac") {
    const cz = getChineseZodiac(birthDate);
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image
            src={`/chinese-zodiac/${cz.id}.png`}
            alt={cz.ko}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="text-center space-y-0.5">
          <p className="font-mystic text-lg font-semibold">
            {cz.emoji} {cz.ko}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
