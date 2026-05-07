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
}> = [
  {
    key: "wood",
    ko: "나무",
    hanja: "木",
    barColor: "bg-[oklch(0.65_0.16_145)]",
    dotColor: "bg-[oklch(0.65_0.16_145)]",
    textColor: "text-[oklch(0.78_0.18_145)]",
  },
  {
    key: "fire",
    ko: "불",
    hanja: "火",
    barColor: "bg-destructive",
    dotColor: "bg-destructive",
    textColor: "text-destructive",
  },
  {
    key: "earth",
    ko: "흙",
    hanja: "土",
    barColor: "bg-[oklch(0.72_0.10_60)]",
    dotColor: "bg-[oklch(0.72_0.10_60)]",
    textColor: "text-[oklch(0.52_0.10_60)]",
  },
  {
    key: "metal",
    ko: "쇠",
    hanja: "金",
    barColor: "bg-muted-foreground",
    dotColor: "bg-muted-foreground",
    textColor: "text-foreground",
  },
  {
    key: "water",
    ko: "물",
    hanja: "水",
    barColor: "bg-[oklch(0.45_0.20_250)]",
    dotColor: "bg-[oklch(0.45_0.20_250)]",
    textColor: "text-[oklch(0.65_0.15_250)]",
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
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic text-lg">오행 분포</CardTitle>
        <CardDescription className="text-xs">
          사주 {total} 글자가 어떤 기운으로 채워졌는지 한눈에.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* stacked bar + 라벨을 하나의 묶음으로 */}
        <div className="space-y-1.5">
          {/* 한 줄 stacked bar */}
          <div className="flex gap-1">
            {slots.map((el, i) => (
              <div
                key={i}
                className={cn(
                  "h-10 flex-1 rounded-md transition-all",
                  el.barColor,
                )}
                aria-label={`${el.ko} (${el.hanja})`}
                title={`${el.ko} (${el.hanja})`}
              />
            ))}
          </div>

          {/* 오행 라벨 — bar 바로 아래 한 줄로 붙여서 */}
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap px-0.5">
            {ELEMENTS.map((el) => {
              const count = elements[el.key];
              return (
                <span
                  key={el.key}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-opacity",
                    count === 0 && "opacity-35",
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full flex-shrink-0",
                      el.dotColor,
                    )}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">{el.ko}</span>
                  <span className={cn("font-mystic font-semibold tabular-nums", el.textColor)}>
                    {count}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
          <Insight
            title="강한 기운"
            hanja={strongest.hanja}
            value={strongest.ko}
            textColor={strongest.textColor}
            dotColor={strongest.dotColor}
          />
          <Insight
            title="약한 기운"
            hanja={weakest.hanja}
            value={weakest.ko}
            textColor={weakest.textColor}
            dotColor={weakest.dotColor}
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
  muted = false,
}: {
  title: string;
  hanja: string;
  value: string;
  textColor: string;
  dotColor: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2.5",
        muted ? "bg-muted/30" : "bg-primary/10",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p className={cn("font-medium mt-0.5 flex items-center gap-1.5", textColor)}>
        <span
          className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", dotColor)}
          aria-hidden
        />
        <span className="font-mystic">
          {value} <span className="opacity-60 text-xs">{hanja}</span>
        </span>
      </p>
    </div>
  );
}
