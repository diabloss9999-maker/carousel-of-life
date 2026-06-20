"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FiveElementsValue {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

interface FiveElementsChartProps {
  elements: FiveElementsValue;
}

const ELEMENTS = [
  {
    key: "wood" as const,
    label: "목",
    desc: "성장",
    color: "#34d399",
    textClass: "text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  {
    key: "fire" as const,
    label: "화",
    desc: "표현",
    color: "#f87171",
    textClass: "text-red-400",
    dotClass: "bg-red-400",
  },
  {
    key: "earth" as const,
    label: "토",
    desc: "안정",
    color: "#fbbf24",
    textClass: "text-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    key: "metal" as const,
    label: "금",
    desc: "기준",
    color: "#94a3b8",
    textClass: "text-slate-400",
    dotClass: "bg-slate-400",
  },
  {
    key: "water" as const,
    label: "수",
    desc: "유연함",
    color: "#38bdf8",
    textClass: "text-sky-400",
    dotClass: "bg-sky-400",
  },
];

const R = 30;
const CX = 40;
const CY = 40;
const CIRC = 2 * Math.PI * R;

interface GaugeRingProps {
  color: string;
  isEmpty: boolean;
  isStrongest: boolean;
  label: string;
  pct: number;
}

function GaugeRing({
  color,
  isEmpty,
  isStrongest,
  label,
  pct,
}: GaugeRingProps) {
  const offset = CIRC * (1 - pct / 100);

  return (
    <svg
      viewBox="0 0 80 80"
      className="h-full w-full"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={5}
      />
      {!isEmpty ? (
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            filter: isStrongest ? `drop-shadow(0 0 6px ${color})` : undefined,
          }}
        />
      ) : null}
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: `${CX}px ${CY}px`,
          fontFamily: "var(--font-serif), serif",
          fontSize: isEmpty ? "14px" : "16px",
          fontWeight: "700",
          fill: isEmpty ? "rgba(255,255,255,0.25)" : color,
          filter: isStrongest ? `drop-shadow(0 0 6px ${color})` : undefined,
        }}
      >
        {label}
      </text>
    </svg>
  );
}

export function FiveElementsChart({ elements }: FiveElementsChartProps) {
  const total = ELEMENTS.reduce((s, e) => s + elements[e.key], 0) || 1;
  const sorted = [...ELEMENTS].sort((a, b) => elements[b.key] - elements[a.key]);
  const strongest = sorted[0]!;
  const weakest = sorted[sorted.length - 1]!;

  return (
    <Card className="border-white/20 bg-white/10 shadow-none backdrop-blur-md">
      <CardContent className="space-y-5 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mystic text-xl font-semibold text-foreground/90">
              오행 균형
            </p>
            <p className="mt-0.5 text-[15px] text-muted-foreground">
              전체 {total}개 기운을 기준으로 정리했어요.
            </p>
          </div>
          <span className="text-[15px] font-medium text-muted-foreground/50">
            오행
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {ELEMENTS.map((el) => {
            const count = elements[el.key];
            const pct = Math.round((count / total) * 100);
            const isStrongest = el.key === strongest.key && count > 0;
            const isEmpty = count === 0;

            return (
              <div key={el.key} className="flex flex-col items-center gap-1.5">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                  <GaugeRing
                    pct={pct}
                    color={el.color}
                    isStrongest={isStrongest}
                    isEmpty={isEmpty}
                    label={el.label}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "font-mystic text-[15px] font-semibold leading-none",
                      isEmpty ? "text-muted-foreground/60" : el.textClass,
                    )}
                  >
                    {el.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {el.desc}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-mystic text-base font-bold leading-tight",
                      isEmpty ? "text-muted-foreground/60" : el.textClass,
                    )}
                  >
                    {count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="mb-1.5 text-[15px] text-muted-foreground/80">
              강한 기운
            </p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", strongest.dotClass)} />
              <span className={cn("font-mystic text-[15px] font-bold", strongest.textClass)}>
                {strongest.label}
              </span>
              <span className="text-[15px] text-muted-foreground/70">
                {strongest.desc}
              </span>
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="mb-1.5 text-[15px] text-muted-foreground/80">
              보완할 기운
            </p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full opacity-50", weakest.dotClass)} />
              <span className={cn("font-mystic text-[15px] font-semibold opacity-70", weakest.textClass)}>
                {weakest.label}
              </span>
              <span className="text-[15px] text-muted-foreground/65">
                {weakest.desc}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
