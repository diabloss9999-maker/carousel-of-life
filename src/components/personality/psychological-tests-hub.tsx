"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarHeart,
  Flame,
  Heart,
  Magnet,
  MessageCircle,
  Moon,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ShareButton } from "@/components/shared/share-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResultId = "warm" | "guarded" | "intense" | "free";

type Choice = {
  label: string;
  result: ResultId;
};

type Question = {
  text: string;
  choices: Choice[];
};

type ResultProfile = {
  action: string;
  badge: string;
  details: string[];
  summary: string;
  title: string;
};

type PsychologicalTest = {
  anchor: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  id: string;
  questions: Question[];
  results: Record<ResultId, ResultProfile>;
  target: string;
  theme: string;
  time: string;
  title: string;
  tone: string;
};

const RESULT_ORDER: ResultId[] = ["warm", "guarded", "intense", "free"];

const TEST_DEFS = [
  ["love-loop", "내가 반복하는 사랑 패턴", "연애 심리", "좋아하는 방식, 불안해지는 순간, 반복되는 선택을 짚어요.", Heart, "bg-rose-50 text-rose-700 ring-rose-200", "연애에서", "반복되는 호감과 불안 신호를", "상대의 말보다 만난 뒤 내 마음이 어떻게 변하는지 보는 것"],
  ["mind-weather", "요즘 내 마음 날씨", "감정 체크", "지금 마음이 맑은지, 지친 건지, 방향을 잃은 건지 가볍게 확인해요.", Waves, "bg-sky-50 text-sky-700 ring-sky-200", "감정에서", "마음의 흐름을", "생각과 피로와 회복 욕구를 따로 구분하는 것"],
  ["attraction", "내가 끌리는 사람 유형", "호감 분석", "나는 어떤 사람에게 마음이 가는지, 설렘의 버튼을 찾아요.", Sparkles, "bg-amber-50 text-amber-700 ring-amber-200", "호감에서", "끌림의 신호를", "순간의 설렘과 오래 남는 매력을 구분하는 것"],
  ["attachment", "관계에서 나는 어떤 방식일까", "관계 성향", "가까워질수록 편한지, 불안한지, 거리가 필요한지 봐요.", ShieldCheck, "bg-emerald-50 text-emerald-700 ring-emerald-200", "가까운 관계에서", "애착 반응을", "내가 원하는 거리와 상대가 읽는 신호의 차이를 줄이는 것"],
  ["choice-2026", "2026년에 내가 조심해야 할 선택", "새해 심리", "올해 반복하지 말아야 할 결정 습관을 미리 점검해요.", CalendarHeart, "bg-violet-50 text-violet-700 ring-violet-200", "선택 앞에서", "결정 습관을", "바로 결정할 일과 시간을 두고 볼 일을 나누는 것"],
  ["toxic-signal", "나를 은근히 힘들게 하는 사람 유형", "관계 레이더", "왜 특정 사람 앞에서만 지치는지 관계 피로 신호를 찾아봐요.", ShieldCheck, "bg-stone-50 text-stone-700 ring-stone-200", "관계에서", "관계 피로를", "상대의 말보다 만난 뒤 내 에너지가 어떻게 변하는지 보는 것"],
  ["crush-trigger", "내가 진짜로 설레는 순간", "설렘 버튼", "외모보다 더 강하게 반응하는 나만의 설렘 포인트를 확인해요.", Magnet, "bg-pink-50 text-pink-700 ring-pink-200", "호감에서", "설렘의 버튼을", "즉흥적인 끌림과 오래 가는 호감을 구분하는 것"],
  ["red-flag-blind", "내가 자꾸 놓치는 연애 위험 신호", "레드플래그", "분명 이상한데 넘겼던 패턴, 내가 약해지는 경고등을 찾아요.", Flame, "bg-red-50 text-red-700 ring-red-200", "연애 판단에서", "위험 신호를", "좋아하는 마음과 불편한 신호를 따로 기록하는 것"],
  ["ex-shadow", "전 연애가 아직 남긴 그림자", "미련 점검", "끝난 줄 알았는데 반복되는 방어, 기대, 비교 습관을 가볍게 봐요.", Moon, "bg-indigo-50 text-indigo-700 ring-indigo-200", "지난 관계 이후", "남은 감정을", "현재의 사람에게 과거의 기준을 덧씌우지 않는 것"],
  ["ghosting-style", "내가 잠수타고 싶어지는 진짜 이유", "회피 패턴", "답장을 미루는 순간, 도망치는 건지 쉬는 건지 확인해요.", MessageCircle, "bg-slate-50 text-slate-700 ring-slate-200", "소통에서", "회피 신호를", "말할 힘이 없는 상태와 말하기 싫은 상태를 구분하는 것"],
  ["jealousy-button", "내 질투 버튼은 어디에 눌릴까", "질투 해부", "쿨한 척해도 신경 쓰이는 지점, 질투 뒤의 욕구를 봐요.", Heart, "bg-rose-50 text-rose-700 ring-rose-200", "애정 확인에서", "불안의 버튼을", "질투를 비난하지 말고 어떤 확인을 원하는지 묻는 것"],
  ["money-persona", "내 소비 습관이 들키는 테스트", "돈 성향", "아끼는 사람인지, 쓰고 후회하는 사람인지 돈 앞의 성격을 봐요.", Target, "bg-emerald-50 text-emerald-700 ring-emerald-200", "돈을 쓸 때", "소비 패턴을", "소비 금액보다 소비 전 감정과 소비 후 기분을 보는 것"],
  ["work-burnout", "내 번아웃이 오는 방식", "에너지 경고", "갑자기 무너지는 타입인지, 조용히 닳는 타입인지 알아차려요.", Zap, "bg-orange-50 text-orange-700 ring-orange-200", "일과 루틴에서", "소진 신호를", "참을 수 있는지보다 회복 속도가 떨어졌는지 확인하는 것"],
  ["friendship-rank", "친구 사이에서 나는 어떤 포지션일까", "친구 관계", "상담자, 분위기 메이커, 거리 유지형 중 내 역할을 찾아요.", Waves, "bg-cyan-50 text-cyan-700 ring-cyan-200", "친구 관계에서", "관계 속 역할을", "내가 편한 역할과 사람들이 기대하는 역할을 분리하는 것"],
  ["reply-temperature", "카톡 답장 온도로 보는 내 마음", "답장 심리", "빨리 답하는 이유, 늦게 답하는 이유 속 진짜 감정 온도를 봐요.", MessageCircle, "bg-lime-50 text-lime-700 ring-lime-200", "메시지 앞에서", "소통 온도를", "답장 속도보다 답장 후 마음이 편한지 확인하는 것"],
  ["self-esteem-mask", "내 자존감이 낮아지는 순간", "자존감 트리거", "괜찮은 척하지만 마음이 작아지는 장면을 정확히 짚어봐요.", Brain, "bg-violet-50 text-violet-700 ring-violet-200", "자존감에서", "흔들리는 지점을", "남의 평가와 내 실제 상태를 분리해서 보는 것"],
  ["secret-ambition", "사실 내가 제일 욕심내는 것", "숨은 욕망", "인정, 자유, 안정, 몰입 중 내가 가장 놓치기 싫은 것을 찾아요.", Sparkles, "bg-amber-50 text-amber-700 ring-amber-200", "선택 앞에서", "숨은 욕구를", "겉으로 말하는 목표와 실제로 포기 못 하는 감정을 나누는 것"],
  ["decision-habit", "선택장애처럼 보이는 진짜 이유", "결정 습관", "못 고르는 게 아니라 무엇을 잃을까 봐 멈추는지 확인해요.", CalendarHeart, "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200", "결정 순간에", "결정 패턴을", "정답 찾기보다 감당 가능한 선택지를 고르는 것"],
  ["lonely-pattern", "사람 많은데 외로운 이유", "외로움 분석", "연락은 많은데 마음이 비는 순간, 내가 원하는 연결 방식을 봐요.", Moon, "bg-blue-50 text-blue-700 ring-blue-200", "외로움에서", "연결 욕구를", "사람 수보다 진짜로 편하게 말할 수 있는 공간을 보는 것"],
  ["first-impression-gap", "남들이 보는 나와 실제 나의 차이", "첫인상 갭", "차가워 보이는데 따뜻한지, 밝아 보이는데 예민한지 확인해요.", Brain, "bg-teal-50 text-teal-700 ring-teal-200", "첫인상에서", "이미지의 간극을", "보여지는 모습과 실제로 편한 모습을 둘 다 인정하는 것"],
] as const;

const TESTS: PsychologicalTest[] = TEST_DEFS.map(
  ([id, title, eyebrow, description, icon, tone, theme, target, anchor]) =>
    createTest({ id, title, eyebrow, description, icon, tone, theme, target, anchor }),
);

export function PsychologicalTestsHub() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTest = TESTS.find((test) => test.id === selectedId) ?? null;

  if (selectedTest) {
    return <PsychologicalTestRunner test={selectedTest} onBack={() => setSelectedId(null)} />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-primary/70">
            Psychology Tests
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            눌러보고 공유하기 좋은 심리 테스트
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted-foreground">
            연애, 관계, 자존감, 소비, 번아웃까지 사람들이 바로 궁금해할 주제를
            짧고 선명하게 확인해요.
          </p>
        </div>
        <span className="w-fit rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[13px] font-semibold text-primary">
          20개 테스트
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TESTS.map((test) => {
          const Icon = test.icon;
          return (
            <button
              key={test.id}
              type="button"
              onClick={() => setSelectedId(test.id)}
              className="group overflow-hidden rounded-3xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <PsychArt testId={test.id} className="h-28 rounded-none" />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("grid h-11 w-11 place-items-center rounded-[16px] ring-1", test.tone)}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="rounded-full border px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
                    {test.time}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-primary">{test.eyebrow}</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">{test.title}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                    {test.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                  시작하기
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PsychologicalTestRunner({
  onBack,
  test,
}: {
  onBack: () => void;
  test: PsychologicalTest;
}) {
  const [answers, setAnswers] = useState<ResultId[]>([]);
  const step = answers.length;
  const resultId = answers.length === test.questions.length ? getResultId(answers) : null;
  const progress = Math.round((answers.length / test.questions.length) * 100);
  const question = test.questions[step];
  const result = useMemo(
    () => (resultId ? test.results[resultId] : null),
    [resultId, test.results],
  );
  const Icon = test.icon;

  function choose(choice: Choice) {
    setAnswers((current) => [...current, choice.result]);
  }

  function reset() {
    setAnswers([]);
  }

  if (result && resultId) {
    const guide = getResultGuide(resultId, test);
    return (
      <section className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          테스트 목록
        </Button>

        <div className="overflow-hidden rounded-3xl border bg-card">
          <PsychArt testId={test.id} resultId={resultId} className="h-44 rounded-none sm:h-56" />
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[16px] ring-1", test.tone)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-primary">{test.eyebrow}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{result.title}</h2>
                  <p className="mt-1 text-[14px] font-semibold text-muted-foreground">{result.badge}</p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[12px] font-semibold text-primary">
                {test.title}
              </span>
            </div>

            <p className="rounded-3xl border bg-background/60 p-4 text-[17px] font-semibold leading-7">
              {result.summary}
            </p>

            <div className="grid gap-3">
              {result.details.map((detail) => (
                <p key={detail} className="rounded-2xl border bg-background/45 p-4 text-[15px] leading-7">
                  {detail}
                </p>
              ))}
            </div>

            <div className="rounded-3xl bg-foreground px-5 py-4 text-background">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] opacity-70">
                Next Action
              </p>
              <p className="mt-2 text-[15px] leading-7">{result.action}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {guide.map((item) => (
                <div key={item.title} className="rounded-2xl border bg-background/45 p-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={reset} className="gap-2">
                <RefreshCcw className="h-4 w-4" aria-hidden />
                다시 하기
              </Button>
              <ShareButton
                title={`${test.title}: ${result.title}`}
                text={`${test.title}\n결과: ${result.title}\n${result.summary}`}
                label="결과 공유"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        테스트 목록
      </Button>

      <div className="overflow-hidden rounded-3xl border bg-card">
        <PsychArt testId={test.id} className="h-36 rounded-none sm:h-44" />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[16px] ring-1", test.tone)}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-primary">{test.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{test.title}</h2>
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
                  {test.description}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
              {step + 1} / {test.questions.length}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="rounded-3xl border bg-background/55 p-4 sm:p-5">
            <p className="text-xl font-semibold leading-8">{question.text}</p>
            <div className="mt-4 grid gap-2">
              {question.choices.map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  onClick={() => choose(choice)}
                  className="rounded-2xl border bg-card px-4 py-3 text-left text-[15px] font-semibold leading-6 transition hover:border-primary/40 hover:bg-primary/[0.06]"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function createTest({
  anchor,
  description,
  eyebrow,
  icon,
  id,
  target,
  theme,
  title,
  tone,
}: Omit<PsychologicalTest, "questions" | "results" | "time">): PsychologicalTest {
  return {
    id,
    title,
    eyebrow,
    description,
    time: "약 1분",
    icon,
    tone,
    theme,
    target,
    anchor,
    questions: buildQuestions(theme),
    results: buildResults(target, anchor),
  };
}

function buildQuestions(theme: string): Question[] {
  return [
    {
      text: `${theme} 가장 자주 반복되는 내 반응은?`,
      choices: [
        { label: "상대나 상황을 먼저 살피고 맞춰준다", result: "warm" },
        { label: "불확실하면 일단 거리를 두고 확인한다", result: "guarded" },
        { label: "느낌이 오면 빠르게 몰입하고 행동한다", result: "intense" },
        { label: "내 리듬과 자유가 깨지는지 먼저 본다", result: "free" },
      ],
    },
    {
      text: "마음이 흔들릴 때 제일 먼저 하는 행동은?",
      choices: [
        { label: "괜찮은 척하다가 혼자 오래 생각한다", result: "guarded" },
        { label: "바로 표현하거나 확인받고 싶어진다", result: "intense" },
        { label: "상대가 편해지도록 분위기를 부드럽게 만든다", result: "warm" },
        { label: "잠깐 벗어나 내 공간을 되찾는다", result: "free" },
      ],
    },
    {
      text: "내가 가장 못 견디는 상황은?",
      choices: [
        { label: "서로의 마음을 배려하지 않는 분위기", result: "warm" },
        { label: "말과 행동이 달라서 믿기 어려운 상황", result: "guarded" },
        { label: "분명한 답 없이 애매하게 끌리는 상황", result: "intense" },
        { label: "내 선택권이 줄어드는 상황", result: "free" },
      ],
    },
    {
      text: "결국 내가 원하는 결말은?",
      choices: [
        { label: "편안하게 오래 이어지는 안정감", result: "warm" },
        { label: "확실한 근거가 있는 신뢰", result: "guarded" },
        { label: "강하게 살아있는 몰입감", result: "intense" },
        { label: "나답게 움직일 수 있는 여유", result: "free" },
      ],
    },
  ];
}

function buildResults(target: string, anchor: string): Record<ResultId, ResultProfile> {
  return {
    warm: {
      title: "부드럽게 붙잡는 안정형",
      badge: "관계 감각",
      summary: `당신은 ${target} 볼 때 분위기와 사람의 마음을 함께 살피는 편이에요.`,
      details: [
        "상황이 거칠어져도 바로 밀어붙이기보다 모두가 덜 다치게 만드는 쪽을 먼저 생각해요.",
        "다만 너무 오래 맞춰주면 내 욕구가 뒤로 밀려서 나중에 피로가 크게 올 수 있어요.",
        `${anchor}이 지금 결과를 더 선명하게 보는 핵심이에요.`,
      ],
      action: "이번 주에는 내가 괜찮은 척하고 넘긴 장면 하나를 짧게라도 말해보세요.",
    },
    guarded: {
      title: "확신이 생겨야 움직이는 신중형",
      badge: "안전 확인",
      summary: `당신은 ${target} 쉽게 넘기지 않고, 오래 볼 만한 신호인지 확인하려는 편이에요.`,
      details: [
        "처음엔 느려 보여도 한 번 믿을 수 있다고 판단하면 꽤 단단하게 유지하는 힘이 있어요.",
        "하지만 모든 신호가 완벽해야 움직이려 하면 좋은 타이밍까지 지나칠 수 있어요.",
        `${anchor}이 지금 결과를 더 선명하게 보는 핵심이에요.`,
      ],
      action: "이번 주에는 확실하지 않아도 괜찮은 작은 선택 하나를 먼저 해보세요.",
    },
    intense: {
      title: "감정의 속도가 빠른 몰입형",
      badge: "강한 반응",
      summary: `당신은 ${target} 빠르게 알아차리고, 마음이 움직이면 행동도 선명해지는 편이에요.`,
      details: [
        "몰입력이 좋아서 기회나 감정의 변화를 남들보다 빨리 잡아낼 수 있어요.",
        "다만 순간의 긴장감과 진짜 방향을 헷갈리면 선택이 너무 빨라질 수 있어요.",
        `${anchor}이 지금 결과를 더 선명하게 보는 핵심이에요.`,
      ],
      action: "중요한 반응은 바로 결정하지 말고 하루 뒤에도 같은 마음인지 확인해보세요.",
    },
    free: {
      title: "나만의 리듬을 지키는 독립형",
      badge: "자기 기준",
      summary: `당신은 ${target} 볼 때 나의 공간과 선택권이 살아있는지를 중요하게 봐요.`,
      details: [
        "남에게 휩쓸리기보다 스스로 납득되는 방식으로 움직이려는 힘이 있어요.",
        "다만 너무 멀리서 지켜보기만 하면 필요한 신호가 상대에게 닿지 않을 수 있어요.",
        `${anchor}이 지금 결과를 더 선명하게 보는 핵심이에요.`,
      ],
      action: "이번 주에는 내 공간을 지키면서도 필요한 마음 한 문장은 분명히 남겨보세요.",
    },
  };
}

function getResultId(answers: ResultId[]): ResultId {
  const counts = RESULT_ORDER.reduce(
    (acc, id) => ({ ...acc, [id]: answers.filter((answer) => answer === id).length }),
    {} as Record<ResultId, number>,
  );
  return RESULT_ORDER.reduce((best, id) => (counts[id] > counts[best] ? id : best));
}

function getResultGuide(resultId: ResultId, test: PsychologicalTest) {
  const base = {
    warm: [
      "좋은 점은 분위기를 부드럽게 만들고 관계가 무너지지 않게 잡아주는 힘이에요.",
      "주의할 점은 배려가 길어질수록 내 욕구가 뒤로 밀릴 수 있다는 거예요.",
    ],
    guarded: [
      "좋은 점은 쉽게 휩쓸리지 않고 시간을 두고 진짜 신호를 확인하는 힘이에요.",
      "주의할 점은 완벽한 확신만 기다리다가 좋은 타이밍을 놓칠 수 있다는 거예요.",
    ],
    intense: [
      "좋은 점은 감정의 온도와 변화의 조짐을 빠르게 알아차리는 몰입력이에요.",
      "주의할 점은 순간의 긴장감과 진짜 방향을 헷갈릴 수 있다는 거예요.",
    ],
    free: [
      "좋은 점은 나만의 리듬과 기준을 잃지 않고 스스로 납득되는 답을 찾는 힘이에요.",
      "주의할 점은 내 공간을 지키는 동안 필요한 신호가 상대에게 닿지 않을 수 있다는 거예요.",
    ],
  } satisfies Record<ResultId, string[]>;

  return [
    { title: "잘 작동하는 점", body: base[resultId][0] },
    { title: "흔들리는 지점", body: base[resultId][1] },
    { title: "정확하게 보는 법", body: `${test.anchor}이 중요해요.` },
    { title: "오늘의 체크 질문", body: `${test.theme} 지금 내가 반복하는 반응은 나를 편하게 만들고 있나요, 더 지치게 만들고 있나요?` },
  ];
}

function PsychArt({
  className,
  resultId,
  testId,
}: {
  className?: string;
  resultId?: ResultId;
  testId: string;
}) {
  const palette = getArtPalette(testId, resultId);
  return (
    <div
      className={cn("relative isolate overflow-hidden border border-black/10 bg-white", className)}
      style={{
        background: `radial-gradient(circle at 18% 18%, ${palette.light} 0%, transparent 34%), linear-gradient(135deg, ${palette.bgA}, ${palette.bgB})`,
      }}
      aria-hidden
    >
      <div className="absolute inset-x-8 top-1/2 h-px opacity-45" style={{ background: `linear-gradient(90deg, transparent, ${palette.line}, transparent)` }} />
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-65 blur-sm" style={{ background: palette.soft }} />
      <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full opacity-55 blur-md" style={{ background: palette.light }} />
      <div className="absolute left-[14%] top-[18%] h-28 w-28 rounded-[34px] border-[10px]" style={{ borderColor: palette.primary }} />
      <div className="absolute left-[40%] top-[22%] h-32 w-24 rotate-12 rounded-full" style={{ background: `linear-gradient(180deg, ${palette.secondary}, ${palette.soft})` }} />
      <div className="absolute right-[15%] top-[32%] h-24 w-24 rounded-[28px]" style={{ background: palette.primary, opacity: 0.72 }} />
      <div className="absolute left-[22%] right-[18%] top-[63%] flex justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-2 w-8 rounded-full" style={{ background: palette.line, opacity: 0.22 + i * 0.11 }} />
        ))}
      </div>
      <div className="absolute bottom-3 left-4 rounded-full bg-white/64 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48 backdrop-blur">
        {resultId ? "Result Visual" : "Psychology"}
      </div>
    </div>
  );
}

function getArtPalette(testId: string, resultId?: ResultId) {
  let hash = 0;
  for (let i = 0; i < testId.length; i += 1) {
    hash = (hash * 31 + testId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const resultAccent = {
    warm: "#d7b86e",
    guarded: "#6f7d8d",
    intense: "#cf6f68",
    free: "#5797a6",
  } satisfies Record<ResultId, string>;
  const primary = resultId ? resultAccent[resultId] : `hsl(${hue} 48% 46%)`;
  return {
    bgA: `hsl(${hue} 70% 98%)`,
    bgB: `hsl(${(hue + 28) % 360} 52% 90%)`,
    primary,
    secondary: `hsl(${(hue + 36) % 360} 55% 68%)`,
    soft: `hsl(${(hue + 18) % 360} 70% 84%)`,
    light: "#ffffff",
    line: primary,
  };
}
