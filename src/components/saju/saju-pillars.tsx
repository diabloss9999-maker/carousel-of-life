"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ELEMENT_LABEL,
  POLARITY_LABEL,
  lookupChar,
  type ElementKey,
} from "@/lib/saju/meanings";
import { CHINESE_ZODIAC_LIST } from "@/lib/fortunes/zodiac";
import { cn } from "@/lib/utils";

/** 천간 한자 → 영문 파일명 */
const STEM_TO_IMG: Record<string, string> = {
  甲: "gap", 乙: "eul", 丙: "byung", 丁: "jeong", 戊: "mu",
  己: "gi",  庚: "gyeong", 辛: "sin", 壬: "im",  癸: "gye",
};

/** 지지 한자 → 십이간지 이미지 ID */
const BRANCH_TO_ZODIAC: Record<string, string> = {
  子: "rat",   丑: "ox",      寅: "tiger",  卯: "rabbit",
  辰: "dragon", 巳: "snake",  午: "horse",  未: "goat",
  申: "monkey", 酉: "rooster", 戌: "dog",   亥: "pig",
};

export interface PillarValue {
  stem: string;
  branch: string;
}

export interface SajuPillarsValue {
  year: PillarValue;
  month: PillarValue;
  day: PillarValue;
  hour: PillarValue | null;
}

interface SajuPillarsProps {
  pillars: SajuPillarsValue;
}

const PILLAR_LABEL = {
  year: { ko: "년주", desc: "뿌리" },
  month: { ko: "월주", desc: "환경" },
  day: { ko: "일주", desc: "나" },
  hour: { ko: "시주", desc: "내면" },
} as const;

const STEM_TO_ELEMENT: Record<string, ElementKey> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

const BRANCH_TO_ELEMENT: Record<string, ElementKey> = {
  寅: "wood", 卯: "wood",
  巳: "fire", 午: "fire",
  辰: "earth", 戌: "earth", 丑: "earth", 未: "earth",
  申: "metal", 酉: "metal",
  亥: "water", 子: "water",
};

const ELEMENT_TONE: Record<ElementKey, string> = {
  wood: "border-emerald-300/45 bg-gradient-to-br from-emerald-100/95 via-emerald-200/65 to-emerald-600/30 text-emerald-950 shadow-emerald-950/10 dark:from-emerald-400/25 dark:via-emerald-500/18 dark:to-emerald-950/55 dark:text-emerald-100",
  fire: "border-rose-300/50 bg-gradient-to-br from-rose-100/95 via-red-200/65 to-red-600/35 text-red-950 shadow-red-950/10 dark:from-red-400/25 dark:via-red-500/18 dark:to-red-950/55 dark:text-red-100",
  earth:
    "border-amber-300/55 bg-gradient-to-br from-amber-100/95 via-yellow-200/65 to-orange-500/30 text-amber-950 shadow-amber-950/10 dark:from-amber-300/24 dark:via-yellow-500/18 dark:to-amber-950/55 dark:text-amber-100",
  metal:
    "border-stone-300/65 bg-gradient-to-br from-stone-50/95 via-zinc-200/75 to-zinc-500/30 text-zinc-950 shadow-zinc-950/10 dark:from-zinc-200/22 dark:via-zinc-400/16 dark:to-zinc-950/55 dark:text-zinc-100",
  water:
    "border-sky-300/50 bg-gradient-to-br from-sky-100/95 via-cyan-200/65 to-blue-600/30 text-sky-950 shadow-sky-950/10 dark:from-sky-400/24 dark:via-blue-500/16 dark:to-blue-950/60 dark:text-sky-100",
};

export function SajuPillars({ pillars }: SajuPillarsProps) {
  const pillarKeys: Array<keyof SajuPillarsValue> = [
    "year",
    "month",
    "day",
    "hour",
  ];

  const [activeId, setActiveId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // 외부 클릭 / Esc 로 닫기.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!wrapperRef.current.contains(e.target)) {
        setActiveId(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveId(null);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <Card className="relative overflow-visible border-white/20 bg-white/10 shadow-none backdrop-blur-md">
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="font-mystic text-xl text-foreground">
              사주팔자
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              네 기둥 여덟 글자 — 글자를 누르면 의미가 펼쳐져.
            </CardDescription>
          </div>
          <div className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium text-foreground/80 sm:block">
            四柱
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div ref={wrapperRef} className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {pillarKeys.map((key) => {
            const pillar = pillars[key];
            const label = PILLAR_LABEL[key];

            const stemId = `${key}-stem`;
            const branchId = `${key}-branch`;

            return (
              <div
                key={key}
                className="relative flex min-w-0 flex-col items-center gap-2 rounded-xl border border-amber-200/65 bg-white/42 px-1.5 py-3 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_10px_30px_oklch(0.18_0.04_55/0.08)] dark:border-amber-200/10 dark:bg-white/[0.045] sm:gap-3 sm:px-3 sm:py-4"
              >
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-semibold text-foreground">
                    {label.ko}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {label.desc}
                  </span>
                </div>
                {pillar ? (
                  <>
                    <Char
                      value={pillar.stem}
                      kind="stem"
                      id={stemId}
                      active={activeId === stemId}
                      onToggle={() =>
                        setActiveId((prev) => (prev === stemId ? null : stemId))
                      }
                    />
                    <Char
                      value={pillar.branch}
                      kind="branch"
                      id={branchId}
                      active={activeId === branchId}
                      onToggle={() =>
                        setActiveId((prev) =>
                          prev === branchId ? null : branchId,
                        )
                      }
                    />
                  </>
                ) : (
                  <>
                    <CharEmpty />
                    <CharEmpty />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {!pillars.hour ? (
          <p className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-xs text-muted-foreground">
            태어난 시각이 비어있어 시주는 비워뒀어.
          </p>
        ) : null}

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          글자를 탭하면 음양·오행·뜻을 볼 수 있어.
        </p>
      </CardContent>
    </Card>
  );
}

interface CharProps {
  value: string;
  kind: "stem" | "branch";
  id: string;
  active: boolean;
  onToggle: () => void;
}

function Char({ value, kind, id, active, onToggle }: CharProps) {
  const lookup = lookupChar(value);
  const element =
    kind === "stem" ? STEM_TO_ELEMENT[value] : BRANCH_TO_ELEMENT[value];
  const tone = element ? ELEMENT_TONE[element] : "bg-muted/40 text-foreground";
  const ko = lookup?.meaning.ko ?? "";
  const zodiacId = kind === "branch" ? BRANCH_TO_ZODIAC[value] : null;
  const zodiacInfo = zodiacId
    ? CHINESE_ZODIAC_LIST.find((c) => c.id === zodiacId)
    : null;
  // 천간 이미지 — 없으면 십이간지 이미지로 폴백
  const stemImgId = kind === "stem" ? (STEM_TO_IMG[value] ?? null) : null;
  // 십이간지 폴백 — 천간 자리에 지지 글자가 온 경우
  const stemZodiacId = kind === "stem" && !stemImgId ? (BRANCH_TO_ZODIAC[value] ?? null) : null;
  const stemZodiacInfo = stemZodiacId ? CHINESE_ZODIAC_LIST.find((c) => c.id === stemZodiacId) : null;

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={active}
        aria-controls={`${id}-popover`}
        onClick={onToggle}
        className={cn(
          "mx-auto w-full max-w-[88px] flex flex-col items-center transition-all focus-visible:outline-none sm:max-w-[120px]",
          "hover:-translate-y-0.5 hover:scale-[1.03]",
          active && "scale-[1.04]",
        )}
      >
        {/* 지지 — 십이간지 이미지 */}
        {zodiacId && zodiacInfo ? (
          <CardImg src={`/chinese-zodiac/${zodiacId}.png`} alt={zodiacInfo.ko} char={value} active={active} />
        ) : stemImgId ? (
          /* 천간 — 천간 이미지 */
          <CardImg src={`/cheongan/${stemImgId}.png`} alt={ko || value} char={value} active={active} />
        ) : (
          /* 천간 자리에 지지 글자 → 십이간지 이미지 */
          <CardImg
            src={`/chinese-zodiac/${stemZodiacId ?? BRANCH_TO_ZODIAC[value]}.png`}
            alt={stemZodiacInfo?.ko ?? value}
            char={value}
            active={active}
          />
        )}
      </button>

      {active && lookup ? (
        <CharPopover
          id={`${id}-popover`}
          lookup={lookup}
          placement={kind === "branch" ? "top" : "bottom"}
        />
      ) : null}
    </div>
  );
}

function CharPopover({
  id,
  lookup,
  placement,
}: {
  id: string;
  lookup: NonNullable<ReturnType<typeof lookupChar>>;
  placement: "top" | "bottom";
}) {
  const { kind, meaning } = lookup;
  const elementLabel = ELEMENT_LABEL[meaning.element];
  const polarityLabel = POLARITY_LABEL[meaning.polarity];
  const opensAbove = placement === "top";

  return (
    <div
      id={id}
      role="dialog"
      className={cn(
        "absolute left-1/2 z-30 w-56 -translate-x-1/2",
        opensAbove ? "bottom-full mb-2" : "top-full mt-2",
        "rounded-xl border border-amber-200/70 bg-amber-50/95 p-3 text-left text-xs text-stone-800",
        "shadow-2xl shadow-stone-950/15 backdrop-blur-md dark:border-amber-200/15 dark:bg-stone-950/95 dark:text-amber-50",
      )}
    >
      <span
        className={cn(
          "absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-amber-200/70 bg-amber-50/95 dark:border-amber-200/15 dark:bg-stone-950/95",
          opensAbove
            ? "-bottom-1.5 border-b border-r"
            : "-top-1.5 border-l border-t",
        )}
        aria-hidden
      />

      <div className="flex items-baseline gap-2">
        <span className="font-mystic text-2xl font-semibold leading-none">
          {meaning.char}
        </span>
        <span className="text-sm text-stone-500 dark:text-amber-100/60">
          {meaning.ko}
        </span>
        <span className="ml-auto rounded-full bg-amber-200/45 px-2 py-0.5 text-[10px] text-amber-900 dark:bg-amber-200/10 dark:text-amber-100/80">
          {kind === "stem" ? "천간" : "지지"}
        </span>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
        <div className="flex items-center gap-1">
          <dt className="text-stone-500 dark:text-amber-100/50">음양</dt>
          <dd className="font-medium">{polarityLabel}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="text-stone-500 dark:text-amber-100/50">오행</dt>
          <dd className="font-medium">{elementLabel}</dd>
        </div>
        {kind === "branch" ? (
          <>
            <div className="flex items-center gap-1">
              <dt className="text-stone-500 dark:text-amber-100/50">동물</dt>
              <dd className="font-medium">{meaning.animal}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="text-stone-500 dark:text-amber-100/50">시간</dt>
              <dd className="font-medium tabular-nums">{meaning.timeRange}</dd>
            </div>
          </>
        ) : (
          <div className="col-span-2 flex items-center gap-1">
            <dt className="text-stone-500 dark:text-amber-100/50">상징</dt>
            <dd className="font-medium">{meaning.symbol}</dd>
          </div>
        )}
      </dl>

      <p className="mt-2 text-[11px] leading-relaxed text-stone-600 dark:text-amber-100/65">
        {meaning.description}
      </p>
    </div>
  );
}

function CardImg({ src, alt, char, active }: { src: string; alt: string; char: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div className={cn(
        "relative w-full aspect-[2/3] overflow-hidden rounded-xl border-2 shadow-lg transition-all",
        active ? "border-amber-400 shadow-xl ring-2 ring-amber-400/60" : "border-white/30 shadow-md",
      )}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 640px) 88px, 120px" quality={90} />
      </div>
      <span className="font-mystic text-base font-bold text-foreground leading-none sm:text-lg">{char}</span>
    </div>
  );
}

function CharEmpty() {
  return (
    <div className="mx-auto flex aspect-[2/3] w-full max-w-[88px] items-center justify-center rounded-xl border border-dashed border-amber-300/45 bg-white/25 dark:border-amber-200/15 dark:bg-white/[0.03] sm:max-w-[120px]">
      <span className="text-xs text-stone-400 dark:text-amber-100/35">·</span>
    </div>
  );
}
