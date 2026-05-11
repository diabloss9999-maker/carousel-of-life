"use client";

/**
 * 성격 유형 테스트 클라이언트 컴포넌트.
 *
 * 20문항을 1개씩 보여주고 선택 시 자동으로 다음 문항으로 진행.
 * 마지막 문항 제출 후 결과 카드를 렌더.
 */

import Image from "next/image";
import { useState, useTransition } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { savePersonalityResult } from "@/lib/personality/actions";
import {
  QUESTIONS,
  calcPersonalityResult,
  type Choice,
  type AxisResult,
} from "@/lib/personality/questions";
import { TYPE_INFO } from "@/lib/personality/types";
import { cn } from "@/lib/utils";

interface PersonalityTestProps {
  /** 이미 저장된 유형 (재테스트 or 첫 시작 여부 판단). */
  currentType: string | null;
}

export function PersonalityTest({ currentType }: PersonalityTestProps) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<(Choice | null)[]>(
    Array(20).fill(null),
  );
  const [current, setCurrent] = useState(0); // 현재 문항 인덱스
  const [resultType, setResultType] = useState<string | null>(currentType);
  const [axes, setAxes] = useState<Record<string, AxisResult> | null>(null);
  const [isPending, startTransition] = useTransition();

  /** 선택지 클릭 시 호출. */
  function handleSelect(choice: Choice) {
    const next = [...answers];
    next[current] = choice;
    setAnswers(next);

    if (current < QUESTIONS.length - 1) {
      // 다음 문항으로 이동
      setTimeout(() => setCurrent((c) => c + 1), 280);
    } else {
      // 마지막 문항 — 퍼센트 계산 후 제출
      const calcResult = calcPersonalityResult(next as Choice[]);
      setAxes(calcResult.axes);
      startTransition(async () => {
        const result = await savePersonalityResult(next as Choice[]);
        if ("error" in result) {
          // 에러 시 결과 표시는 하되 저장은 실패 (로컬 계산값 사용)
          const calcResult = calcPersonalityResult(next as Choice[]);
          setAxes(calcResult.axes);
          setResultType(calcResult.type);
        } else {
          setResultType(result.type);
        }
      });
    }
  }

  /** 결과 화면 (테스트 완료 후 or 기존 결과) */
  if (resultType && !started) {
    const info = TYPE_INFO[resultType as keyof typeof TYPE_INFO];
    return (
      <ResultCard
        info={info}
        axes={axes}
        onRetest={() => {
          setStarted(true);
          setAnswers(Array(20).fill(null));
          setCurrent(0);
          setResultType(null);
          setAxes(null);
        }}
      />
    );
  }

  /** 시작 전 화면 */
  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="h-12" />
        <div className="space-y-2">
          <h2 className="font-mystic text-2xl font-semibold">
            나는 어떤 유형일까?
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            20개의 질문으로 나의 성격 유형을 알아봐.
            <br />
            솔직하게 답할수록 정확해져.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border/40 bg-card/50 p-3 space-y-1">
            <p>약 3~5분</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/50 p-3 space-y-1">
            <p>20문항</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/50 p-3 space-y-1">
            <p>16가지 유형</p>
          </div>
        </div>
        <Button size="lg" className="min-w-44" onClick={() => setStarted(true)}>
          테스트 시작
        </Button>
      </div>
    );
  }

  /** 제출 중 */
  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="h-10 animate-pulse" />
        <p className="font-mystic text-lg">유형을 분석하고 있어…</p>
      </div>
    );
  }

  /** 결과가 나온 직후 (테스트 완료) */
  if (resultType) {
    const info = TYPE_INFO[resultType as keyof typeof TYPE_INFO];
    return (
      <ResultCard
        info={info}
        axes={axes}
        onRetest={() => {
          setStarted(true);
          setAnswers(Array(20).fill(null));
          setCurrent(0);
          setResultType(null);
          setAxes(null);
        }}
      />
    );
  }

  /** 테스트 진행 화면 */
  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  return (
    <div className="space-y-6">
      {/* 진행 바 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{current + 1} / {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 문항 카드 */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur space-y-6">
        <p className="font-mystic text-lg font-medium leading-relaxed text-center">
          {current + 1}. 나는…
        </p>

        <div className="flex flex-col gap-3">
          <ChoiceButton
            label="A"
            text={q.a}
            selected={answers[current] === "A"}
            onClick={() => handleSelect("A")}
          />
          <ChoiceButton
            label="B"
            text={q.b}
            selected={answers[current] === "B"}
            onClick={() => handleSelect("B")}
          />
        </div>
      </div>

      {/* 이전 문항 */}
      {current > 0 && (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent((c) => c - 1)}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전 문항
          </Button>
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  label,
  text,
  selected,
  onClick,
}: {
  label: string;
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-4 text-left text-sm transition-all",
        "hover:border-primary/60 hover:bg-primary/5",
        selected
          ? "border-primary bg-primary/10 font-medium"
          : "border-border/40 bg-card/40",
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 h-6 w-6 rounded-full border text-xs font-bold flex items-center justify-center mt-0.5",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/60 text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="leading-relaxed">{text}</span>
    </button>
  );
}

const AXIS_CONFIG = [
  { axis: "EI", labelA: "E 외향", labelB: "I 내향" },
  { axis: "SN", labelA: "S 감각", labelB: "N 직관" },
  { axis: "TF", labelA: "T 사고", labelB: "F 감정" },
  { axis: "JP", labelA: "J 판단", labelB: "P 인식" },
] as const;

function ResultCard({
  info,
  axes,
  onRetest,
}: {
  info: (typeof TYPE_INFO)[keyof typeof TYPE_INFO];
  axes: Record<string, AxisResult> | null;
  onRetest: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* 유형 헤더 */}
      <div className="flex flex-col items-center gap-4 text-center">
        {/* MBTI 카드 이미지 */}
        <div className="relative w-44 sm:w-52 aspect-[2/3] overflow-hidden rounded-2xl shadow-xl">
          <Image
            src={`/mbti/${info.type}.png`}
            alt={info.type}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-1">
          <p className="font-mystic text-3xl font-bold tracking-widest text-primary">
            {info.type}
          </p>
          <p className="font-mystic text-lg font-medium">{info.nickname}</p>
          <p className="text-xs text-muted-foreground/70 italic">{info.imageRole}</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mt-1">
            {info.summary}
          </p>
        </div>
      </div>

      {/* 축별 퍼센트 바 */}
      {axes && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
          <h3 className="font-mystic font-semibold text-sm">성향 강도</h3>
          <div className="space-y-3">
            {AXIS_CONFIG.map(({ axis, labelA, labelB }) => {
              const ax = axes[axis];
              if (!ax) return null;
              const isA = ax.winner === "A";
              const winnerLabel = isA ? labelA : labelB;
              const pct = ax.pct;
              return (
                <div key={axis} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={cn(isA ? "text-primary font-semibold" : "")}>{labelA}</span>
                    <span className={cn(!isA ? "text-primary font-semibold" : "")}>{labelB}</span>
                  </div>
                  <div className="relative h-2.5 w-full rounded-full bg-border/40 overflow-hidden">
                    <div
                      className={cn(
                        "absolute top-0 h-full rounded-full bg-primary transition-all",
                        isA ? "left-0" : "right-0",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground">
                    {winnerLabel} {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 어울리는 직업 */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-2">
        <h3 className="font-mystic font-semibold text-sm">어울리는 직업</h3>
        <div className="flex flex-wrap gap-1.5">
          {info.suitableJobs.map((job) => (
            <span key={job} className="rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-xs text-primary font-medium">
              {job}
            </span>
          ))}
        </div>
      </div>

      {/* 상세 설명 */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-2">
        <h3 className="font-mystic font-semibold text-sm">나는 이런 사람이야</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {info.description}
        </p>
      </div>

      {/* 강점 */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
        <h3 className="font-mystic font-semibold text-sm text-accent">강점</h3>
        <ul className="space-y-1.5">
          {info.strengths.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* 주의점 */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
        <h3 className="font-mystic font-semibold text-sm text-muted-foreground">이런 점 주의해</h3>
        <ul className="space-y-1.5">
          {info.cautions.map((c) => (
            <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* 잘 맞는 / 주의 유형 — 2열 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 잘 맞는 유형 */}
        <div className="space-y-2">
          <h3 className="font-mystic font-semibold text-sm text-center">💞 잘 맞는</h3>
          <div className="flex justify-center gap-2">
            {info.compatibleWith.map((t) => {
              const ti = TYPE_INFO[t];
              return (
                <div key={t} className="flex flex-col items-center gap-1">
                  <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-primary/40">
                    <Image src={`/mbti/${t}.png`} alt={t} fill className="object-cover" sizes="96px" />
                  </div>
                  <p className="font-mystic text-[11px] font-bold text-primary">{t}</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">{ti.nickname}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 주의가 필요한 유형 */}
        <div className="space-y-2">
          <h3 className="font-mystic font-semibold text-sm text-center">주의</h3>
          <div className="flex justify-center gap-2">
            {info.incompatibleWith.map((t) => {
              const ti = TYPE_INFO[t];
              return (
                <div key={t} className="flex flex-col items-center gap-1">
                  <div className="relative w-20 sm:w-24 aspect-[2/3] overflow-hidden rounded-xl shadow-md ring-2 ring-destructive/40 grayscale-[30%]">
                    <Image src={`/mbti/${t}.png`} alt={t} fill className="object-cover" sizes="96px" />
                  </div>
                  <p className="font-mystic text-[11px] font-bold text-destructive">{t}</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">{ti.nickname}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        이 결과는 운세·타로·사주 풀이에 자동으로 반영돼.
      </p>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onRetest}
      >
        다시 테스트하기
      </Button>
    </div>
  );
}
