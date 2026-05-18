/**
 * 사주 4기둥의 지지(地支)를 십이간지 카드로 시각화.
 */
"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import type { SajuPillarsValue } from "./saju-pillars";
import { CHINESE_ZODIAC_LIST, type ChineseZodiacSign } from "@/lib/fortunes/zodiac";

/** 지지 한자 → 십이간지 ID 매핑 */
const BRANCH_TO_ZODIAC: Record<string, ChineseZodiacSign> = {
  子: "rat",   丑: "ox",      寅: "tiger",  卯: "rabbit",
  辰: "dragon", 巳: "snake",  午: "horse",  未: "goat",
  申: "monkey", 酉: "rooster", 戌: "dog",   亥: "pig",
};

const PILLAR_TKEYS = {
  year:  "pillarYear",
  month: "pillarMonth",
  day:   "pillarDay",
  hour:  "pillarHour",
} as const;

interface SajuZodiacCardsProps {
  pillars: SajuPillarsValue;
}

export function SajuZodiacCards({ pillars }: SajuZodiacCardsProps) {
  const t = useTranslations("sajuPillars");
  const tZ = useTranslations("sajuZodiac");

  const entries = (["year", "month", "day", "hour"] as const).map((key) => {
    const pillar = pillars[key];
    if (!pillar) return null;
    const id = BRANCH_TO_ZODIAC[pillar.branch];
    if (!id) return null;
    const info = CHINESE_ZODIAC_LIST.find((c) => c.id === id);
    if (!info) return null;
    return { key, labelKey: PILLAR_TKEYS[key], branch: pillar.branch, info };
  }).filter(Boolean) as {
    key: string;
    labelKey: "pillarYear" | "pillarMonth" | "pillarDay" | "pillarHour";
    branch: string;
    info: (typeof CHINESE_ZODIAC_LIST)[number];
  }[];

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-mystic text-base font-semibold text-foreground/80">
        {tZ("heading")}
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {entries.map(({ key, labelKey, branch, info }) => (
          <div key={key} className="flex flex-col items-center gap-2 text-center">
            <span className="text-[15px] font-medium text-muted-foreground">
              {t(labelKey)}
            </span>

            <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl shadow-md">
              <Image
                src={`/chinese-zodiac/${info.id}.webp`}
                alt={info.ko}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 25vw, 120px"
              />
            </div>

            <div className="space-y-0.5">
              <p className="font-mystic text-[15px] font-semibold leading-none">
                {branch}
              </p>
              <p className="text-[15px] text-muted-foreground">
                {info.ko}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
