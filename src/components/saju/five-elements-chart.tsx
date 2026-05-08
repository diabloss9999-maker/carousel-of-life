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
  { key: "wood"  as const, ko: "나무", hanja: "木", bar: "bg-gradient-to-r from-emerald-400 to-emerald-600", dot: "bg-emerald-500", text: "text-emerald-700" },
  { key: "fire"  as const, ko: "불",   hanja: "火", bar: "bg-gradient-to-r from-rose-400 to-red-600",     dot: "bg-red-500",     text: "text-red-600"     },
  { key: "earth" as const, ko: "흙",   hanja: "土", bar: "bg-gradient-to-r from-amber-400 to-orange-500", dot: "bg-amber-500",   text: "text-amber-700"   },
  { key: "metal" as const, ko: "쇠",   hanja: "金", bar: "bg-gradient-to-r from-zinc-300 to-zinc-500",    dot: "bg-zinc-400",    text: "text-zinc-600"    },
  { key: "water" as const, ko: "물",   hanja: "水", bar: "bg-gradient-to-r from-sky-400 to-blue-600",     dot: "bg-sky-400",     text: "text-[#38bdf8]"  },
];

export function FiveElementsChart({ elements }: FiveElementsChartProps) {
  const total = ELEMENTS.reduce((s, e) => s + elements[e.key], 0) || 1;
  const sorted = [...ELEMENTS].sort((a, b) => elements[b.key] - elements[a.key]);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <div className="space-y-4">
      {/* 타이틀 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mystic text-xl font-semibold text-foreground/90">오행 분포</p>
          <p className="text-xs text-muted-foreground mt-0.5">사주 {total}글자의 기운 분포</p>
        </div>
        <span className="text-[11px] text-muted-foreground/60 font-medium">五行</span>
      </div>

      {/* 가로 바 차트 */}
      <div className="space-y-2.5">
        {ELEMENTS.map((el) => {
          const count = elements[el.key];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={el.key} className="flex items-center gap-3">
              {/* 이름 */}
              <div className="w-10 flex-shrink-0 text-right">
                <span className={cn("text-xs font-semibold", count === 0 ? "text-muted-foreground/40" : el.text)}>
                  {el.ko}
                </span>
              </div>
              {/* 바 */}
              <div className="flex-1 h-4 rounded-full bg-black/8 overflow-hidden">
                {count > 0 && (
                  <div
                    className={cn("h-full rounded-full transition-all", el.bar)}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
              {/* 숫자 */}
              <div className="w-6 flex-shrink-0 text-center">
                <span className={cn("font-mystic text-sm font-bold tabular-nums", count === 0 ? "text-muted-foreground/30" : el.text)}>
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 강한/약한 기운 */}
      <div className="flex gap-3 pt-1">
        <div className="flex-1 rounded-xl bg-white/30 dark:bg-white/5 backdrop-blur border border-white/40 dark:border-white/10 px-4 py-3">
          <p className="text-[10px] text-muted-foreground/70 mb-1">강한 기운</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", strongest.dot)} />
            <span className={cn("font-mystic font-semibold text-sm", strongest.text)}>
              {strongest.ko}
            </span>
            <span className="text-xs text-muted-foreground/50 ml-0.5">{strongest.hanja}</span>
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-white/30 dark:bg-white/5 backdrop-blur border border-white/40 dark:border-white/10 px-4 py-3">
          <p className="text-[10px] text-muted-foreground/70 mb-1">약한 기운</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", weakest.dot)} />
            <span className="font-mystic font-semibold text-sm text-muted-foreground/70">
              {weakest.ko}
            </span>
            <span className="text-xs text-muted-foreground/40 ml-0.5">{weakest.hanja}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
