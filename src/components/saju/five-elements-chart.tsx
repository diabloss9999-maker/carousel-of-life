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
  emoji: string;
  color: string;
}> = [
  { key: "wood",  ko: "나무", hanja: "木", emoji: "🌿", color: "bg-[oklch(0.65_0.16_145)]" },
  { key: "fire",  ko: "불",   hanja: "火", emoji: "🔥", color: "bg-destructive" },
  { key: "earth", ko: "흙",   hanja: "土", emoji: "🪨", color: "bg-accent" },
  { key: "metal", ko: "쇠",   hanja: "金", emoji: "⚙️", color: "bg-muted-foreground" },
  { key: "water", ko: "물",   hanja: "水", emoji: "💧", color: "bg-primary" },
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
        {/* 한 줄 stacked bar — 각 칸이 사주 1글자, 색은 그 글자의 오행. */}
        <div className="flex gap-1">
          {slots.map((el, i) => (
            <div
              key={i}
              className={cn(
                "h-10 flex-1 rounded-md transition-all flex items-center justify-center text-xs",
                el.color,
              )}
              aria-label={el.ko}
              title={`${el.ko} (${el.hanja})`}
            >
              <span aria-hidden className="opacity-90">
                {el.emoji}
              </span>
            </div>
          ))}
        </div>

        {/* 라벨: 5개 오행 정보 */}
        <div className="grid grid-cols-5 gap-2">
          {ELEMENTS.map((el) => {
            const count = elements[el.key];
            return (
              <div
                key={el.key}
                className={cn(
                  "rounded-xl px-2 py-2 text-center transition-opacity",
                  count === 0 && "opacity-40",
                )}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  <span aria-hidden>{el.emoji}</span>
                  <span className="font-medium">{el.ko}</span>
                </div>
                <p className="font-mystic text-base font-semibold tabular-nums mt-0.5">
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
          <Insight
            title="강한 기운"
            emoji={strongest.emoji}
            value={strongest.ko}
            tone="primary"
          />
          <Insight
            title="약한 기운"
            emoji={weakest.emoji}
            value={weakest.ko}
            tone="muted"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Insight({
  title,
  emoji,
  value,
  tone,
}: {
  title: string;
  emoji: string;
  value: string;
  tone: "primary" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2.5",
        tone === "primary" ? "bg-primary/10" : "bg-muted/30",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p className="font-medium mt-0.5 flex items-center gap-1.5">
        <span aria-hidden>{emoji}</span>
        <span>{value}</span>
      </p>
    </div>
  );
}
