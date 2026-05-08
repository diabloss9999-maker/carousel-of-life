/**
 * 사주 4기둥의 지지(地支)를 십이간지 카드로 시각화.
 *
 * 지지는 십이간지(쥐·소·호랑이...)와 1:1 대응.
 */
import Image from "next/image";

import type { SajuPillarsValue } from "./saju-pillars";
import { CHINESE_ZODIAC_LIST, type ChineseZodiacSign } from "@/lib/fortunes/zodiac";

/** 지지 한자 → 십이간지 ID 매핑 */
const BRANCH_TO_ZODIAC: Record<string, ChineseZodiacSign> = {
  子: "rat",   丑: "ox",      寅: "tiger",  卯: "rabbit",
  辰: "dragon", 巳: "snake",  午: "horse",  未: "goat",
  申: "monkey", 酉: "rooster", 戌: "dog",   亥: "pig",
};

const PILLAR_LABEL = {
  year:  "년주",
  month: "월주",
  day:   "일주",
  hour:  "시주",
} as const;

interface SajuZodiacCardsProps {
  pillars: SajuPillarsValue;
}

export function SajuZodiacCards({ pillars }: SajuZodiacCardsProps) {
  const entries = (["year", "month", "day", "hour"] as const).map((key) => {
    const pillar = pillars[key];
    if (!pillar) return null;
    const id = BRANCH_TO_ZODIAC[pillar.branch];
    if (!id) return null;
    const info = CHINESE_ZODIAC_LIST.find((c) => c.id === id);
    if (!info) return null;
    return { key, label: PILLAR_LABEL[key], branch: pillar.branch, info };
  }).filter(Boolean) as {
    key: string;
    label: string;
    branch: string;
    info: (typeof CHINESE_ZODIAC_LIST)[number];
  }[];

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-mystic text-base font-semibold text-foreground/80">
        사주의 네 지지 — 십이간지
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {entries.map(({ key, label, branch, info }) => (
          <div key={key} className="flex flex-col items-center gap-2 text-center">
            {/* 기둥 라벨 */}
            <span className="text-[11px] font-medium text-muted-foreground">
              {label}
            </span>

            {/* 카드 이미지 */}
            <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl shadow-md">
              <Image
                src={`/chinese-zodiac/${info.id}.png`}
                alt={info.ko}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 25vw, 120px"
              />
            </div>

            {/* 한자 + 동물 이름 */}
            <div className="space-y-0.5">
              <p className="font-mystic text-sm font-semibold leading-none">
                {branch}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {info.emoji} {info.ko}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
