"use client";

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
import { cn } from "@/lib/utils";

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
  wood: "bg-[oklch(0.65_0.16_145)]/15 text-[oklch(0.78_0.18_145)]",
  fire: "bg-destructive/15 text-destructive",
  earth: "bg-accent/15 text-accent",
  metal: "bg-muted-foreground/15 text-foreground",
  water: "bg-primary/15 text-primary",
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
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic text-lg">사주팔자</CardTitle>
        <CardDescription className="text-xs">
          네 기둥 여덟 글자 — 글자를 누르면 의미가 펼쳐져.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={wrapperRef} className="grid grid-cols-4 gap-3">
          {pillarKeys.map((key) => {
            const pillar = pillars[key];
            const label = PILLAR_LABEL[key];

            const stemId = `${key}-stem`;
            const branchId = `${key}-branch`;

            return (
              <div
                key={key}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  {label.ko}
                </span>
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
                <span className="text-[10px] text-muted-foreground/70">
                  {label.desc}
                </span>
              </div>
            );
          })}
        </div>

        {!pillars.hour ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            태어난 시각이 비어있어 시주는 비워뒀어.
          </p>
        ) : null}

        <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
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

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={active}
        aria-controls={`${id}-popover`}
        onClick={onToggle}
        className={cn(
          "flex aspect-square w-full max-w-[56px] mx-auto flex-col items-center justify-center rounded-2xl transition-all",
          "hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          active && "ring-2 ring-primary/60 scale-105 shadow-md",
          tone,
        )}
      >
        <span className="font-mystic text-lg font-semibold leading-none sm:text-xl">
          {value}
        </span>
        {ko ? (
          <span className="mt-1 text-[10px] opacity-70">{ko}</span>
        ) : null}
      </button>

      {active && lookup ? (
        <CharPopover id={`${id}-popover`} lookup={lookup} />
      ) : null}
    </div>
  );
}

function CharPopover({
  id,
  lookup,
}: {
  id: string;
  lookup: NonNullable<ReturnType<typeof lookupChar>>;
}) {
  const { kind, meaning } = lookup;
  const elementLabel = ELEMENT_LABEL[meaning.element];
  const polarityLabel = POLARITY_LABEL[meaning.polarity];

  return (
    <div
      id={id}
      role="dialog"
      className={cn(
        "absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2",
        "rounded-xl border border-border/60 bg-popover/95 p-3 text-left text-xs",
        "shadow-xl backdrop-blur-md",
      )}
    >
      {/* arrow */}
      <span
        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-border/60 bg-popover/95"
        aria-hidden
      />

      <div className="flex items-baseline gap-2">
        <span className="font-mystic text-2xl font-semibold leading-none">
          {meaning.char}
        </span>
        <span className="text-sm text-muted-foreground">{meaning.ko}</span>
        <span className="ml-auto text-[10px] text-muted-foreground/80">
          {kind === "stem" ? "천간" : "지지"}
        </span>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
        <div className="flex items-center gap-1">
          <dt className="text-muted-foreground/70">음양</dt>
          <dd className="font-medium">{polarityLabel}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="text-muted-foreground/70">오행</dt>
          <dd className="font-medium">{elementLabel}</dd>
        </div>
        {kind === "branch" ? (
          <>
            <div className="flex items-center gap-1">
              <dt className="text-muted-foreground/70">동물</dt>
              <dd className="font-medium">{meaning.animal}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="text-muted-foreground/70">시간</dt>
              <dd className="font-medium tabular-nums">{meaning.timeRange}</dd>
            </div>
          </>
        ) : (
          <div className="col-span-2 flex items-center gap-1">
            <dt className="text-muted-foreground/70">상징</dt>
            <dd className="font-medium">{meaning.symbol}</dd>
          </div>
        )}
      </dl>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {meaning.description}
      </p>
    </div>
  );
}

function CharEmpty() {
  return (
    <div className="flex aspect-square w-full max-w-[56px] mx-auto items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/20">
      <span className="text-xs text-muted-foreground">·</span>
    </div>
  );
}
