import { BarChart3, CalendarDays, FileText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FiveElementsValue } from "@/components/saju/five-elements-chart";
import type { SajuPillarsValue } from "@/components/saju/saju-pillars";

interface SajuReadingSummaryProps {
  pillars: SajuPillarsValue;
  elements: FiveElementsValue;
  hasDeepReading: boolean;
  subscribed: boolean;
}

const ELEMENT_LABELS: Record<keyof FiveElementsValue, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const ELEMENT_GUIDES: Record<keyof FiveElementsValue, string> = {
  wood: "성장, 시작, 관계 확장",
  fire: "표현, 열정, 주목받는 힘",
  earth: "안정, 책임, 현실 감각",
  metal: "정리, 판단, 기준 세우기",
  water: "생각, 감정, 유연한 적응",
};

const ELEMENT_ACTIONS: Record<keyof FiveElementsValue, string> = {
  wood: "일을 벌리기보다 작은 시작 하나를 정해요.",
  fire: "말과 표현이 앞서지 않게 속도를 한 번 늦춰요.",
  earth: "해야 할 일을 눈에 보이게 정리하면 안정돼요.",
  metal: "기준은 분명히 세우되 너무 차갑게 굴지 않게 해요.",
  water: "생각이 길어질수록 몸을 움직여 균형을 찾아요.",
};

export function SajuReadingSummary({
  pillars,
  elements,
  hasDeepReading,
  subscribed,
}: SajuReadingSummaryProps) {
  const entries = (Object.keys(elements) as Array<keyof FiveElementsValue>)
    .map((key) => ({ key, value: elements[key] }))
    .sort((a, b) => b.value - a.value);
  const strongest = entries[0]!;
  const weakest = entries[entries.length - 1]!;
  const knownPillarCount = [
    pillars.year,
    pillars.month,
    pillars.day,
    pillars.hour,
  ].filter(Boolean).length;

  return (
    <Card className="app-surface border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-mystic text-xl">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              사주 리포트 요약
            </CardTitle>
            <CardDescription>
              명식, 오행 균형, 오늘 바로 적용할 기준을 먼저 정리했어요.
            </CardDescription>
          </div>
          <span className="rounded-full border border-primary/25 px-3 py-1 text-[12px] font-semibold text-primary">
            {subscribed ? "심층 해석 가능" : "기본 리포트"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryBlock
            icon={CalendarDays}
            label="명식 구성"
            value={`${knownPillarCount}개 기둥`}
            body={
              pillars.hour
                ? "태어난 시간까지 반영된 사주예요."
                : "태어난 시간을 넣으면 더 정확해져요."
            }
          />
          <SummaryBlock
            icon={BarChart3}
            label="강한 기운"
            value={`${ELEMENT_LABELS[strongest.key]} 기운`}
            body={ELEMENT_GUIDES[strongest.key]}
          />
          <SummaryBlock
            icon={FileText}
            label="심층 분석"
            value={hasDeepReading ? "완료" : "대기 중"}
            body={
              hasDeepReading
                ? "여러 관점으로 정리했어요."
                : "성향, 관계, 일의 흐름까지 더 볼 수 있어요."
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[13px] font-semibold text-muted-foreground">
              보완할 기운
            </p>
            <p className="mt-1 text-[15px] leading-6">
              <span className="font-semibold text-foreground">
                {ELEMENT_LABELS[weakest.key]} 기운
              </span>
              이 약하게 잡혀 있어요. {ELEMENT_GUIDES[weakest.key]} 쪽을
              무리해서 채우기보다 오늘은 작게 보완하는 방식이 맞아요.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
            <p className="text-[13px] font-semibold text-primary">
              오늘 적용 포인트
            </p>
            <p className="mt-1 text-[15px] leading-6 text-muted-foreground">
              {ELEMENT_ACTIONS[strongest.key]} 부족한{" "}
              {ELEMENT_LABELS[weakest.key]} 기운은 한 번에 바꾸려 하지 말고,
              하루에 하나만 보완해도 충분해요.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryBlock({
  icon: Icon,
  label,
  value,
  body,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
