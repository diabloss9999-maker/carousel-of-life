/**
 * 별자리 · 십이간지 카드 배너.
 */
import Image from "next/image";

import { getZodiacSign, getChineseZodiac, ZODIAC_LIST, CHINESE_ZODIAC_LIST } from "@/lib/fortunes/zodiac";

interface ZodiacBannerProps {
  category: string;
  birthDate: string | null;
}

/** 한글 이름 → 별자리 id 매핑 */
const ZODIAC_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  ZODIAC_LIST.map((z) => [z.ko, z.id]),
);

/** 한글 이름 → 십이간지 id 매핑 */
const CZ_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  CHINESE_ZODIAC_LIST.map((c) => [c.ko, c.id]),
);

export function ZodiacBanner({ category, birthDate }: ZodiacBannerProps) {
  if (!birthDate) return null;

  if (category === "zodiac") {
    const z = getZodiacSign(birthDate);
    return (
      <div className="flex flex-col items-center gap-5">
        {/* 메인 카드 */}
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image src={`/zodiac/${z.id}.png`} alt={z.ko} fill className="object-cover" priority />
        </div>

        {/* 이름 + 날짜 */}
        <div className="text-center space-y-1">
          <p className="font-mystic text-xl font-bold text-foreground/90">{z.ko}</p>
          <p className="text-sm text-muted-foreground">{z.en}</p>
          <p className="text-xs text-muted-foreground/80">{z.dateRange}</p>
        </div>

        {/* 잘 맞는(왼쪽) / 주의(오른쪽) */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* 잘 맞는 별자리 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-center text-foreground/80 tracking-wide">잘 맞는</p>
            <div className="flex justify-center gap-2">
              {z.compatible.map((name) => {
                const id = ZODIAC_NAME_TO_ID[name];
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-primary/40">
                      <Image src={`/zodiac/${id}.png`} alt={name} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[11px] font-medium text-primary text-center">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 주의가 필요한 별자리 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-center text-foreground/80 tracking-wide">주의</p>
            <div className="flex justify-center gap-2">
              {z.incompatible.map((name) => {
                const id = ZODIAC_NAME_TO_ID[name];
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-destructive/40 grayscale-[30%]">
                      <Image src={`/zodiac/${id}.png`} alt={name} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[11px] font-medium text-destructive text-center">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (category === "chinese_zodiac") {
    const cz = getChineseZodiac(birthDate);
    return (
      <div className="flex flex-col items-center gap-5">
        {/* 메인 카드 */}
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image src={`/chinese-zodiac/${cz.id}.png`} alt={cz.ko} fill className="object-cover" priority />
        </div>

        {/* 이름 + 연도 */}
        <div className="text-center space-y-1">
          <p className="font-mystic text-xl font-bold text-foreground/90">{cz.ko}</p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">{cz.yearExample}</p>
        </div>

        {/* 잘 맞는(왼쪽) / 주의(오른쪽) */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-center text-foreground/80 tracking-wide">잘 맞는</p>
            <div className="flex justify-center gap-2">
              {cz.compatible.map((name) => {
                const id = CZ_NAME_TO_ID[name];
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-primary/40">
                      <Image src={`/chinese-zodiac/${id}.png`} alt={name} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[11px] font-medium text-primary text-center">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-center text-foreground/80 tracking-wide">주의</p>
            <div className="flex justify-center gap-2">
              {cz.incompatible.map((name) => {
                const id = CZ_NAME_TO_ID[name];
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-destructive/40 grayscale-[30%]">
                      <Image src={`/chinese-zodiac/${id}.png`} alt={name} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[11px] font-medium text-destructive text-center">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
