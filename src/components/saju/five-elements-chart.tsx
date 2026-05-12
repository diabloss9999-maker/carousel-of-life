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
    ko: "나무",
    hanja: "木",
    stroke: "#34d399",
    glow: "#34d399",
    textClass: "text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  {
    key: "fire" as const,
    ko: "불",
    hanja: "火",
    stroke: "#f87171",
    glow: "#f87171",
    textClass: "text-red-400",
    dotClass: "bg-red-400",
  },
  {
    key: "earth" as const,
    ko: "흙",
    hanja: "土",
    stroke: "#fbbf24",
    glow: "#fbbf24",
    textClass: "text-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    key: "metal" as const,
    ko: "쇠",
    hanja: "金",
    stroke: "#94a3b8",
    glow: "#94a3b8",
    textClass: "text-slate-400",
    dotClass: "bg-slate-400",
  },
  {
    key: "water" as const,
    ko: "물",
    hanja: "水",
    stroke: "#38bdf8",
    glow: "#38bdf8",
    textClass: "text-sky-400",
    dotClass: "bg-sky-400",
  },
];

const R = 30;
const CX = 40;
const CY = 40;
const CIRC = 2 * Math.PI * R; // ≈ 188.5

interface GaugeRingProps {
  pct: number;
  stroke: string;
  glow: string;
  isStrongest: boolean;
  isEmpty: boolean;
  hanja: string;
  textClass: string;
}

function GaugeRing({ pct, stroke, glow, isStrongest, isEmpty, hanja, textClass }: GaugeRingProps) {
  const offset = CIRC * (1 - pct / 100);

  return (
    <svg
      viewBox="0 0 80 80"
      className="w-full h-full"
      style={{ transform: "rotate(-90deg)" }}
    >
      {/* 배경 트랙 */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={5}
      />
      {/* 진행 링 */}
      {!isEmpty && (
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={stroke}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            filter: isStrongest
              ? `drop-shadow(0 0 6px ${glow})`
              : undefined,
          }}
        />
      )}
      {/* 한자 (rotate 보정) */}
      <text
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          fontFamily: "var(--font-serif), serif",
          fontSize: isEmpty ? "14px" : "16px",
          fontWeight: "700",
          fill: isEmpty ? "rgba(255,255,255,0.2)" : stroke,
          filter: isStrongest ? `drop-shadow(0 0 6px ${glow})` : undefined,
        }}
      >
        {hanja}
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
      <CardContent className="pt-5 space-y-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mystic text-xl font-semibold text-foreground/90">오행 분포</p>
            <p className="text-xs text-muted-foreground mt-0.5">사주 {total}글자의 기운 분포</p>
          </div>
          <span className="text-[11px] text-muted-foreground/50 font-medium">五行</span>
        </div>

        {/* 원형 게이지 5개 */}
        <div className="grid grid-cols-5 gap-1">
          {ELEMENTS.map((el) => {
            const count = elements[el.key];
            const pct = Math.round((count / total) * 100);
            const isStrongest = el.key === strongest.key && count > 0;
            const isEmpty = count === 0;

            return (
              <div key={el.key} className="flex flex-col items-center gap-1.5">
                {/* 원형 게이지 */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <GaugeRing
                    pct={pct}
                    stroke={el.stroke}
                    glow={el.glow}
                    isStrongest={isStrongest}
                    isEmpty={isEmpty}
                    hanja={el.hanja}
                    textClass={el.textClass}
                  />
                </div>
                {/* 이름 + 숫자 */}
                <div className="text-center">
                  <p
                    className={cn(
                      "font-mystic text-[11px] font-semibold leading-none",
                      isEmpty ? "text-muted-foreground/60" : el.textClass,
                    )}
                  >
                    {el.ko}
                  </p>
                  <p
                    className={cn(
                      "font-mystic text-base font-bold leading-tight mt-0.5",
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

        {/* 강한/약한 기운 */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-white/10 backdrop-blur border border-white/20 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground/80 mb-1.5">강한 기운</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", strongest.dotClass)} />
              <span className={cn("font-mystic font-bold text-sm", strongest.textClass)}>
                {strongest.ko}
              </span>
              <span className="text-[10px] text-muted-foreground/70">{strongest.hanja}</span>
            </div>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 backdrop-blur border border-white/20 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground/80 mb-1.5">약한 기운</p>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0 opacity-50", weakest.dotClass)} />
              <span className={cn("font-mystic font-semibold text-sm opacity-60", weakest.textClass)}>
                {weakest.ko}
              </span>
              <span className="text-[10px] text-muted-foreground/65">{weakest.hanja}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
