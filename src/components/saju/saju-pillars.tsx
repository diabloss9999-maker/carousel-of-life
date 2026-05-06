import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const STEM_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const BRANCH_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

const STEM_TO_ELEMENT: Record<
  string,
  "wood" | "fire" | "earth" | "metal" | "water"
> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

const BRANCH_TO_ELEMENT: Record<
  string,
  "wood" | "fire" | "earth" | "metal" | "water"
> = {
  寅: "wood", 卯: "wood",
  巳: "fire", 午: "fire",
  辰: "earth", 戌: "earth", 丑: "earth", 未: "earth",
  申: "metal", 酉: "metal",
  亥: "water", 子: "water",
};

const ELEMENT_TONE: Record<
  "wood" | "fire" | "earth" | "metal" | "water",
  string
> = {
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

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic text-lg">사주팔자</CardTitle>
        <CardDescription className="text-xs">
          네 기둥 여덟 글자 — 타고난 기운이야.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {pillarKeys.map((key) => {
            const pillar = pillars[key];
            const label = PILLAR_LABEL[key];

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
                    <Char value={pillar.stem} kind="stem" />
                    <Char value={pillar.branch} kind="branch" />
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
      </CardContent>
    </Card>
  );
}

function Char({ value, kind }: { value: string; kind: "stem" | "branch" }) {
  const koMap = kind === "stem" ? STEM_KO : BRANCH_KO;
  const ko = koMap[value] ?? "";
  const element =
    kind === "stem" ? STEM_TO_ELEMENT[value] : BRANCH_TO_ELEMENT[value];
  const tone = element ? ELEMENT_TONE[element] : "bg-muted/40 text-foreground";

  return (
    <div
      className={cn(
        "flex aspect-square w-full max-w-[56px] flex-col items-center justify-center rounded-2xl",
        tone,
      )}
    >
      <span className="font-mystic text-lg font-semibold leading-none sm:text-xl">
        {value}
      </span>
      {ko ? (
        <span className="mt-1 text-[10px] opacity-70">{ko}</span>
      ) : null}
    </div>
  );
}

function CharEmpty() {
  return (
    <div className="flex aspect-square w-full max-w-[56px] items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/20">
      <span className="text-xs text-muted-foreground">·</span>
    </div>
  );
}
