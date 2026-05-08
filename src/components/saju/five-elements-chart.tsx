import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const ELEMENTS: Array<{
  key: keyof FiveElementsValue;
  ko: string;
  hanja: string;
  /** stacked bar 칸 배경색 */
  barColor: string;
  /** 라벨 도트 색 */
  dotColor: string;
  /** 라벨 텍스트 색 */
  textColor: string;
  /** 부드러운 패널 배경 */
  panelColor: string;
}> = [
  {
    key: "wood",
    ko: "나무",
    hanja: "木",
    barColor:
      "bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-700",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-200",
    panelColor:
      "border-emerald-200/60 bg-emerald-50/65 dark:border-emerald-200/15 dark:bg-emerald-500/10",
  },
  {
    key: "fire",
    ko: "불",
    hanja: "火",
    barColor: "bg-gradient-to-br from-rose-200 via-red-400 to-red-700",
    dotColor: "bg-red-500",
    textColor: "text-red-700 dark:text-red-200",
    panelColor:
      "border-red-200/60 bg-red-50/65 dark:border-red-200/15 dark:bg-red-500/10",
  },
  {
    key: "earth",
    ko: "흙",
    hanja: "土",
    barColor: "bg-gradient-to-br from-amber-100 via-yellow-500 to-orange-700",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-200",
    panelColor:
      "border-amber-200/70 bg-amber-50/70 dark:border-amber-200/15 dark:bg-amber-400/10",
  },
  {
    key: "metal",
    ko: "쇠",
    hanja: "金",
    barColor: "bg-gradient-to-br from-zinc-50 via-zinc-300 to-zinc-600",
    dotColor: "bg-zinc-500",
    textColor: "text-zinc-700 dark:text-zinc-100",
    panelColor:
      "border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-200/15 dark:bg-zinc-300/10",
  },
  {
    key: "water",
    ko: "물",
    hanja: "水",
    barColor: "bg-gradient-to-br from-sky-200 via-blue-500 to-blue-800",
    dotColor: "bg-blue-600",
    textColor: "text-blue-700 dark:text-sky-200",
    panelColor:
      "border-sky-200/70 bg-sky-50/70 dark:border-sky-200/15 dark:bg-blue-500/10",
  },
];

export function FiveElementsChart({ elements }: FiveElementsChartProps) {
  const total =
    elements.wood +
    elements.fire +
    elements.earth +
    elements.metal +
    elements.water;

  const sorted = [...ELEMENTS].sort(
    (a, b) => elements[b.key] - elements[a.key],
  );
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // 한 줄에 펼치기 위한 슬롯 배열. 각 칸 = 사주 1글자.
  const slots: Array<(typeof ELEMENTS)[number]> = [];
  for (const el of ELEMENTS) {
    const count = elements[el.key];
    for (let i = 0; i < count; i++) slots.push(el);
  }

  return (
    <Card className="relative overflow-hidden border-transparent bg-transparent shadow-none">
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="font-mystic text-xl text-amber-950 dark:text-amber-50">
              오행 분포
            </CardTitle>
            <CardDescription className="text-xs text-stone-600 dark:text-amber-100/65">
              사주 {total} 글자가 어떤 기운으로 채워졌는지 한눈에.
            </CardDescription>
          </div>
          <div className="hidden rounded-full border border-amber-300/60 bg-amber-50/70 px-3 py-1 text-[10px] font-medium text-amber-900 shadow-inner shadow-white/50 dark:border-amber-200/15 dark:bg-amber-200/10 dark:text-amber-100/80 sm:block">
            五行
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-5">
        <div className="space-y-3 rounded-xl border border-amber-200/60 bg-white/40 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_12px_30px_oklch(0.18_0.04_55/0.08)] dark:border-amber-200/10 dark:bg-white/[0.045]">
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {slots.map((el, i) => (
              <div
                key={i}
                className={cn(
                  "h-12 rounded-lg border border-white/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_8px_18px_rgb(0_0_0/0.10)] transition-all hover:-translate-y-0.5 sm:h-14",
                  el.barColor,
                )}
                aria-label={`${el.ko} (${el.hanja})`}
                title={`${el.ko} (${el.hanja})`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ELEMENTS.map((el) => {
              const count = elements[el.key];
              return (
                <div
                  key={el.key}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs transition-opacity",
                    el.panelColor,
                    count === 0 && "opacity-35",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm",
                        el.dotColor,
                      )}
                      aria-hidden
                    />
                    <span className="truncate text-stone-600 dark:text-amber-100/65">
                      {el.ko}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-mystic text-sm font-semibold tabular-nums",
                      el.textColor,
                    )}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-amber-200/55 pt-4 dark:border-amber-200/10 sm:grid-cols-2">
          <Insight
            title="강한 기운"
            hanja={strongest.hanja}
            value={strongest.ko}
            textColor={strongest.textColor}
            dotColor={strongest.dotColor}
            panelColor={strongest.panelColor}
          />
          <Insight
            title="약한 기운"
            hanja={weakest.hanja}
            value={weakest.ko}
            textColor={weakest.textColor}
            dotColor={weakest.dotColor}
            panelColor={weakest.panelColor}
            muted
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Insight({
  title,
  hanja,
  value,
  textColor,
  dotColor,
  panelColor,
  muted = false,
}: {
  title: string;
  hanja: string;
  value: string;
  textColor: string;
  dotColor: string;
  panelColor: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_24px_rgb(0_0_0/0.06)]",
        panelColor,
        muted && "opacity-80",
      )}
    >
      <p className="text-[11px] font-medium text-stone-500 dark:text-amber-100/50">
        {title}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-2 font-medium",
          textColor,
        )}
      >
        <span
          className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", dotColor)}
          aria-hidden
        />
        <span className="font-mystic text-lg">
          {value} <span className="text-xs opacity-60">{hanja}</span>
        </span>
      </p>
    </div>
  );
}
