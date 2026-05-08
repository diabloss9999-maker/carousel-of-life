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
    <Card className="relative overflow-visible border-amber-200/70 bg-[linear-gradient(135deg,oklch(0.98_0.018_88/0.92),oklch(0.91_0.045_82/0.78)),radial-gradient(circle_at_top_left,oklch(0.88_0.09_95/0.34),transparent_34%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.11_35/0.22),transparent_38%)] shadow-[0_24px_70px_oklch(0.16_0.05_55/0.18)] backdrop-blur dark:border-amber-300/20 dark:bg-[linear-gradient(135deg,oklch(0.22_0.035_55/0.82),oklch(0.14_0.025_55/0.92)),radial-gradient(circle_at_top_left,oklch(0.68_0.11_88/0.22),transparent_36%),radial-gradient(circle_at_bottom_right,oklch(0.50_0.10_25/0.18),transparent_40%)]">
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-45 [background-image:linear-gradient(90deg,oklch(0.50_0.04_80/0.08)_1px,transparent_1px),linear-gradient(0deg,oklch(0.50_0.04_80/0.08)_1px,transparent_1px)] [background-size:18px_18px]"
        aria-hidden
      />
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="font-mystic text-xl text-amber-950 dark:text-amber-50">
              사주팔자
            </CardTitle>
            <CardDescription className="text-xs text-stone-600 dark:text-amber-100/65">
              네 기둥 여덟 글자 — 글자를 누르면 의미가 펼쳐져.
            </CardDescription>
          </div>
          <div className="hidden rounded-full border border-amber-300/60 bg-amber-50/70 px-3 py-1 text-[10px] font-medium text-amber-900 shadow-inner shadow-white/50 dark:border-amber-200/15 dark:bg-amber-200/10 dark:text-amber-100/80 sm:block">
            四柱
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div ref={wrapperRef} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pillarKeys.map((key) => {
            const pillar = pillars[key];
            const label = PILLAR_LABEL[key];

            const stemId = `${key}-stem`;
            const branchId = `${key}-branch`;

            return (
              <div
                key={key}
                className="relative flex min-w-0 flex-col items-center gap-2 rounded-xl border border-amber-200/65 bg-white/42 px-2.5 py-3 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_10px_30px_oklch(0.18_0.04_55/0.08)] dark:border-amber-200/10 dark:bg-white/[0.045]"
              >
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-semibold text-stone-600 dark:text-amber-100/70">
                    {label.ko}
                  </span>
                  <span className="block text-[10px] text-stone-500 dark:text-amber-100/45">
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
          <p className="mt-4 rounded-lg border border-amber-200/55 bg-amber-50/45 px-3 py-2 text-center text-xs text-stone-600 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-amber-100/65">
            태어난 시각이 비어있어 시주는 비워뒀어.
          </p>
        ) : null}

        <p className="mt-3 text-center text-[11px] text-stone-500 dark:text-amber-100/45">
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

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={active}
        aria-controls={`${id}-popover`}
        onClick={onToggle}
        className={cn(
          "mx-auto w-full max-w-[62px] flex flex-col items-center transition-all focus-visible:outline-none",
          "hover:-translate-y-0.5 hover:scale-[1.03]",
          active && "scale-[1.04]",
        )}
      >
        {zodiacId && zodiacInfo ? (
          /* 지지 — 십이간지 카드 이미지 */
          <div className={cn(
            "relative w-full aspect-[2/3] overflow-hidden rounded-xl border-2 shadow-lg transition-all",
            active ? "border-amber-400 shadow-xl ring-2 ring-amber-400/60" : "border-white/30 shadow-md",
          )}>
            <Image
              src={`/chinese-zodiac/${zodiacId}.png`}
              alt={zodiacInfo.ko}
              fill
              className="object-cover"
              sizes="62px"
            />
            {/* 한자 오버레이 */}
            <div className="absolute bottom-0 inset-x-0 bg-black/45 backdrop-blur-[2px] py-1 text-center">
              <span className="font-mystic text-base font-bold text-white leading-none">{value}</span>
            </div>
          </div>
        ) : (
          /* 천간 — 기존 칩 스타일 */
          <div className={cn(
            "mx-auto flex aspect-square w-full max-w-[62px] flex-col items-center justify-center rounded-xl border shadow-lg ring-1 ring-white/35",
            active && "border-amber-300 ring-2 ring-amber-400/70 shadow-xl",
            tone,
          )}>
            <span className="font-mystic text-2xl font-semibold leading-none sm:text-3xl">
              {value}
            </span>
            {ko ? (
              <span className="mt-1 text-[10px] font-medium opacity-75">{ko}</span>
            ) : null}
          </div>
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

function CharEmpty() {
  return (
    <div className="mx-auto flex aspect-square w-full max-w-[62px] items-center justify-center rounded-xl border border-dashed border-amber-300/45 bg-white/25 dark:border-amber-200/15 dark:bg-white/[0.03]">
      <span className="text-xs text-stone-400 dark:text-amber-100/35">·</span>
    </div>
  );
}
