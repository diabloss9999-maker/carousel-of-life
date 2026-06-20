import {
  CalendarHeart,
  HeartHandshake,
  Map,
  Sparkles,
} from "lucide-react";

import type { FortuneCategoryId } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ReadingKind = "fortune" | "tarot" | "saju" | "compatibility";

interface RelatableReadingCardProps {
  kind: ReadingKind;
  category?: FortuneCategoryId;
  className?: string;
}

const fortuneCopy: Record<
  FortuneCategoryId,
  { title: string; body: string; points: string[] }
> = {
  general: {
    title: "오늘 하루가 막연할 때, 먼저 볼 한 장",
    body: "큰 예언보다 오늘 바로 써먹을 기분, 말투, 선택 기준을 짧게 정리해요.",
    points: ["오늘 조심할 흐름", "먼저 잡아야 할 일", "나에게 맞는 한 줄"],
  },
  love: {
    title: "답장을 기다리거나, 마음이 헷갈릴 때",
    body: "상대의 마음을 단정하기보다 지금 내 태도와 거리감을 어떻게 잡을지 알려줘요.",
    points: ["다가갈 타이밍", "피해야 할 말", "오늘의 연애 온도"],
  },
  money: {
    title: "쓰고 싶은 마음과 아껴야 할 마음이 부딪힐 때",
    body: "오늘 돈이 새기 쉬운 지점과 기분 따라 쓰지 않기 위한 기준을 잡아줘요.",
    points: ["지출 주의점", "돈이 붙는 행동", "오늘의 소비 기준"],
  },
  career: {
    title: "일이 많거나, 어디부터 해야 할지 모를 때",
    body: "오늘 업무에서 힘을 줄 곳과 괜히 에너지 뺏길 일을 구분해줘요.",
    points: ["우선순위", "대화 주의점", "성과가 나는 방향"],
  },
  health: {
    title: "몸은 괜찮다는데 묘하게 지칠 때",
    body: "무리하지 않으면서도 하루 리듬을 회복할 수 있는 작은 신호를 짚어요.",
    points: ["오늘의 컨디션", "쉬어야 할 부분", "가벼운 회복 루틴"],
  },
  study: {
    title: "앉아는 있는데 집중이 안 될 때",
    body: "공부 운을 점수처럼 보는 대신, 오늘 잘 먹히는 집중 방식으로 바꿔줘요.",
    points: ["집중 시간대", "막히는 과목", "시작하기 좋은 방식"],
  },
  zodiac: {
    title: "내 별자리 분위기가 오늘 어떤지 궁금할 때",
    body: "별자리 흐름을 생활 언어로 풀어서 오늘의 감정과 대인운에 붙여줘요.",
    points: ["오늘의 무드", "사람 사이 흐름", "행운 포인트"],
  },
  chinese_zodiac: {
    title: "오늘은 밀고 갈지, 조심할지 알고 싶을 때",
    body: "띠의 흐름을 어렵게 설명하지 않고 오늘의 행동 방향으로 바꿔줘요.",
    points: ["조심할 선택", "잘 맞는 속도", "오늘의 기회"],
  },
};

const readingCopy: Record<
  Exclude<ReadingKind, "fortune">,
  { eyebrow: string; title: string; body: string; points: string[] }
> = {
  tarot: {
    eyebrow: "마음 정리",
    title: "이미 마음은 있는데, 확신이 없을 때",
    body: "타로는 미래를 겁주는 도구가 아니라 지금 마음이 어디에 걸려 있는지 보여주는 거울처럼 쓰면 좋아요.",
    points: ["고민의 핵심", "지금 필요한 태도", "오늘 해볼 작은 선택"],
  },
  saju: {
    eyebrow: "나 이해하기",
    title: "왜 나는 비슷한 선택을 반복할까",
    body: "사주는 어려운 한자 풀이보다 내 성향, 강점, 지치는 패턴을 알아채는 데 집중해요.",
    points: ["타고난 리듬", "반복되는 장단점", "올해/오늘의 방향"],
  },
  compatibility: {
    eyebrow: "관계 읽기",
    title: "좋은데 왜 자꾸 엇갈리는지 궁금할 때",
    body: "궁합은 맞다/안 맞다로 끝내지 않고, 두 사람이 편해지는 거리와 대화 방식을 찾아줘요.",
    points: ["끌리는 이유", "부딪히는 지점", "잘 맞추는 말투"],
  },
};

const iconByKind: Record<ReadingKind, typeof Sparkles> = {
  fortune: CalendarHeart,
  tarot: Sparkles,
  saju: Map,
  compatibility: HeartHandshake,
};

export function RelatableReadingCard({
  kind,
  category = "general",
  className,
}: RelatableReadingCardProps) {
  const Icon = iconByKind[kind];
  const copy =
    kind === "fortune"
      ? {
          eyebrow: "오늘 바로 쓰는 운세",
          ...fortuneCopy[category],
        }
      : readingCopy[kind];

  return (
    <section
      className={cn(
        "app-surface rounded-2xl border border-white/10 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary/80">
              {copy.eyebrow}
            </p>
            <h2 className="text-balance-ko text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h2>
            <p className="text-keep text-[15px] leading-relaxed text-muted-foreground">
              {copy.body}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {copy.points.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] font-semibold text-foreground/90"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
