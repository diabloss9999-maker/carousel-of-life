/**
 * 별자리 · 십이간지 카드 배너.
 */
import Image from "next/image";

import { getZodiacSign, getChineseZodiac } from "@/lib/fortunes/zodiac";

interface ZodiacBannerProps {
  category: string;
  birthDate: string | null;
}

export function ZodiacBanner({ category, birthDate }: ZodiacBannerProps) {
  if (!birthDate) return null;

  if (category === "zodiac") {
    const z = getZodiacSign(birthDate);
    return (
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* 카드 이미지 */}
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl flex-shrink-0 mx-auto sm:mx-0">
          <Image src={`/zodiac/${z.id}.png`} alt={z.ko} fill className="object-cover" priority />
        </div>

        {/* 정보 */}
        <div className="flex-1 space-y-4 pt-1">
          {/* 이름 + 날짜 범위 */}
          <div>
            <p className="font-mystic text-2xl font-bold text-foreground/90">{z.ko}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{z.en}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{z.dateRange}</p>
          </div>

          {/* 잘 맞는 별자리 */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">잘 맞는 별자리</p>
            <div className="flex flex-wrap gap-1.5">
              {z.compatible.map((name) => (
                <span key={name} className="rounded-full bg-primary/15 border border-primary/30 px-3 py-0.5 text-xs font-medium text-primary">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* 안 맞는 별자리 */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">주의가 필요한 별자리</p>
            <div className="flex flex-wrap gap-1.5">
              {z.incompatible.map((name) => (
                <span key={name} className="rounded-full bg-destructive/10 border border-destructive/25 px-3 py-0.5 text-xs font-medium text-destructive">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (category === "chinese_zodiac") {
    const cz = getChineseZodiac(birthDate);
    return (
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* 카드 이미지 */}
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl flex-shrink-0 mx-auto sm:mx-0">
          <Image src={`/chinese-zodiac/${cz.id}.png`} alt={cz.ko} fill className="object-cover" priority />
        </div>

        {/* 정보 */}
        <div className="flex-1 space-y-4 pt-1">
          {/* 이름 + 해당 연도 */}
          <div>
            <p className="font-mystic text-2xl font-bold text-foreground/90">{cz.ko}</p>
            <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">{cz.yearExample}</p>
          </div>

          {/* 잘 맞는 띠 */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">잘 맞는 띠</p>
            <div className="flex flex-wrap gap-1.5">
              {cz.compatible.map((name) => (
                <span key={name} className="rounded-full bg-primary/15 border border-primary/30 px-3 py-0.5 text-xs font-medium text-primary">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* 안 맞는 띠 */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">주의가 필요한 띠</p>
            <div className="flex flex-wrap gap-1.5">
              {cz.incompatible.map((name) => (
                <span key={name} className="rounded-full bg-destructive/10 border border-destructive/25 px-3 py-0.5 text-xs font-medium text-destructive">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
