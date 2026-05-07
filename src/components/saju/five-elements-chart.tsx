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

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic text-lg">오행 분포</CardTitle>
        <CardDescription className="text-xs">
          여덟 글자에 깃든 다섯 기운이야.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {ELEMENTS.map((el) => {
            const value = elements[el.key];
            return (
              <div key={el.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    <span aria-hidden>{el.emoji}</span>
                    <span>{el.ko}</span>
                    <span className="text-xs text-muted-foreground/60 font-mystic">
                      ({el.hanja})
                    </span>
                  </span>
                  <span className="text-muted-foreground tabular-nums text-xs">
                    {value} / {total}
                  </span>
                </div>
                {/* 사주 글자 수만큼의 칸 grid — 채워진 칸 / 빈 칸으로 시각화. */}
                <div className="flex gap-1">
                  {Array.from({ length: total }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-3 flex-1 rounded-md transition-all",
                        i < value ? el.color : "bg-muted/40",
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
          <Insight title="강한 기운" emoji={strongest.emoji} value={strongest.ko} tone="primary" />
          <Insight title="약한 기운" emoji={weakest.emoji} value={weakest.ko} tone="muted" />
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
