import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

const PILLARS = [
  { key: "year", label: "년주", desc: "바깥 흐름" },
  { key: "month", label: "월주", desc: "사회적 리듬" },
  { key: "day", label: "일주", desc: "나의 중심" },
  { key: "hour", label: "시주", desc: "세부 성향" },
] as const;

export function SajuPillars({ pillars }: SajuPillarsProps) {
  return (
    <Card className="border-white/20 bg-white/10 shadow-none backdrop-blur-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="font-mystic text-xl text-foreground">
              사주 명식
            </CardTitle>
            <CardDescription className="text-[15px] text-muted-foreground">
              네 개의 기둥으로 기본 흐름을 봐요.
            </CardDescription>
          </div>
          <div className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[15px] font-medium text-foreground/80 sm:block">
            명식
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {PILLARS.map(({ key, label, desc }) => {
            const pillar = pillars[key];
            return (
              <div
                key={key}
                className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-amber-200/45 bg-white/30 px-1.5 py-3 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] backdrop-blur-md dark:border-amber-200/20 dark:bg-white/15 sm:px-3 sm:py-4"
              >
                <div className="space-y-0.5">
                  <span className="block text-[15px] font-semibold text-foreground">
                    {label}
                  </span>
                  <span className="block text-[12px] text-muted-foreground">
                    {desc}
                  </span>
                </div>
                {pillar ? (
                  <div className="flex flex-col items-center gap-2">
                    <SajuChar value={pillar.stem} label="천간" />
                    <SajuChar value={pillar.branch} label="지지" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <SajuChar value="-" label="천간" muted />
                    <SajuChar value="-" label="지지" muted />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!pillars.hour ? (
          <p className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-[15px] text-muted-foreground">
            태어난 시간을 입력하면 시주까지 더 정확하게 볼 수 있어요.
          </p>
        ) : null}

        <p className="mt-3 text-center text-[15px] text-muted-foreground">
          천간은 겉으로 드러나는 기운, 지지는 안쪽에 깔린 흐름으로 보면
          좋아요.
        </p>
      </CardContent>
    </Card>
  );
}

function SajuChar({
  label,
  muted = false,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div className="w-full rounded-xl border border-white/20 bg-background/45 px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mystic text-2xl font-bold leading-none ${
          muted ? "text-muted-foreground/45" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
