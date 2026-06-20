/**
 * 별자리 · 십이간지 카드 배너.
 */
"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { getZodiacSign, getChineseZodiac, ZODIAC_LIST, CHINESE_ZODIAC_LIST, type ZodiacSign, type ChineseZodiacSign } from "@/lib/fortunes/zodiac";

interface ZodiacBannerProps {
  category: string;
  birthDate: string | null;
}

/** 한글 이름 → 별자리 id 매핑 */
const ZODIAC_NAME_TO_ID: Record<string, ZodiacSign> = Object.fromEntries(
  ZODIAC_LIST.map((z) => [z.ko, z.id]),
) as Record<string, ZodiacSign>;

/** 한글 이름 → 십이간지 id 매핑 */
const CZ_NAME_TO_ID: Record<string, ChineseZodiacSign> = Object.fromEntries(
  CHINESE_ZODIAC_LIST.map((c) => [c.ko, c.id]),
) as Record<string, ChineseZodiacSign>;

export function ZodiacBanner({ category, birthDate }: ZodiacBannerProps) {
  const t = useTranslations("zodiacBanner");
  const tDate = useTranslations("zodiacDateRange");
  const tZName = useTranslations("zodiacName");
  const tCzName = useTranslations("chineseZodiacName");
  if (!birthDate) return null;

  if (category === "zodiac") {
    const z = getZodiacSign(birthDate);
    const mainLabel = tZName(z.id);
    return (
      <div className="flex flex-col items-center gap-5">
        {/* 메인 카드 */}
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image src={`/zodiac/${z.id}.webp`} alt={mainLabel} fill className="object-cover" priority />
        </div>

        {/* 이름 + 날짜 */}
        <div className="text-center space-y-1">
          <p className="font-mystic text-xl font-bold text-foreground/90">{mainLabel}</p>
          <p className="text-[15px] text-muted-foreground">{z.en}</p>
          <p className="text-[15px] text-muted-foreground/80">{tDate(z.id)}</p>
        </div>

        {/* 잘 맞는(왼쪽) / 주의(오른쪽) */}
        <div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          {/* 잘 맞는 별자리 */}
          <div className="space-y-3 rounded-2xl app-surface p-3">
            <p className="text-[15px] font-semibold text-center text-foreground/80 tracking-wide">{t("compatible")}</p>
            <div className="grid grid-cols-2 gap-3">
              {z.compatible.map((name) => {
                const id = ZODIAC_NAME_TO_ID[name];
                const label = id ? tZName(id) : name;
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative mx-auto w-full max-w-[88px] sm:max-w-[96px] aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-primary/40">
                      <Image src={`/zodiac/${id}.webp`} alt={label} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[15px] font-medium text-primary text-center">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 주의가 필요한 별자리 */}
          <div className="space-y-3 rounded-2xl app-surface p-3">
            <p className="text-[15px] font-semibold text-center text-foreground/80 tracking-wide">{t("caution")}</p>
            <div className="grid grid-cols-2 gap-3">
              {z.incompatible.map((name) => {
                const id = ZODIAC_NAME_TO_ID[name];
                const label = id ? tZName(id) : name;
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative mx-auto w-full max-w-[88px] sm:max-w-[96px] aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-destructive/40 grayscale-[30%]">
                      <Image src={`/zodiac/${id}.webp`} alt={label} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[15px] font-medium text-destructive text-center">{label}</span>
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
    const mainLabel = tCzName(cz.id);
    return (
      <div className="flex flex-col items-center gap-5">
        {/* 메인 카드 */}
        <div className="relative w-36 sm:w-44 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image src={`/chinese-zodiac/${cz.id}.webp`} alt={mainLabel} fill className="object-cover" priority />
        </div>

        {/* 이름 + 연도 */}
        <div className="text-center space-y-1">
          <p className="font-mystic text-xl font-bold text-foreground/90">{mainLabel}</p>
          <p className="text-[15px] text-muted-foreground/60 leading-relaxed">{cz.yearExample}</p>
        </div>

        {/* 잘 맞는(왼쪽) / 주의(오른쪽) */}
        <div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-3 rounded-2xl app-surface p-3">
            <p className="text-[15px] font-semibold text-center text-foreground/80 tracking-wide">{t("compatible")}</p>
            <div className="grid grid-cols-2 gap-3">
              {cz.compatible.map((name) => {
                const id = CZ_NAME_TO_ID[name];
                const label = id ? tCzName(id) : name;
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative mx-auto w-full max-w-[88px] sm:max-w-[96px] aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-primary/40">
                      <Image src={`/chinese-zodiac/${id}.webp`} alt={label} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[15px] font-medium text-primary text-center">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl app-surface p-3">
            <p className="text-[15px] font-semibold text-center text-foreground/80 tracking-wide">{t("caution")}</p>
            <div className="grid grid-cols-2 gap-3">
              {cz.incompatible.map((name) => {
                const id = CZ_NAME_TO_ID[name];
                const label = id ? tCzName(id) : name;
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="relative mx-auto w-full max-w-[88px] sm:max-w-[96px] aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-destructive/40 grayscale-[30%]">
                      <Image src={`/chinese-zodiac/${id}.webp`} alt={label} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-[15px] font-medium text-destructive text-center">{label}</span>
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
