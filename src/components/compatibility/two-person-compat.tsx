"use client";

import type React from "react";
import { useActionState } from "react";
import { Heart, Loader2, UsersRound } from "lucide-react";

import {
  twoPersonCompatAction,
  type TwoPersonCompatState,
} from "@/app/(dashboard)/compatibility/actions";
import { CompatConflict } from "@/components/compatibility/compat-conflict";
import { CompatPurpose } from "@/components/compatibility/compat-purpose";
import { CompatToday } from "@/components/compatibility/compat-today";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { safeReadingText, safeShortText } from "@/lib/content/safety";
import { cn } from "@/lib/utils";

const twoPersonCompatIdleState: TwoPersonCompatState = { kind: "idle" };
const TODAY_ISO = (): string => new Date().toISOString().slice(0, 10);

interface TwoPersonCompatProps {
  subscribed: boolean;
}

export function TwoPersonCompat({ subscribed }: TwoPersonCompatProps) {
  const [state, formAction, isPending] = useActionState(
    twoPersonCompatAction,
    twoPersonCompatIdleState,
  );

  useScrollToResult(isPending, "two-person-result", 200);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <UsersRound className="h-5 w-5 text-accent" aria-hidden />
            두 사람 궁합
          </CardTitle>
          <CardDescription className="text-[15px]">
            나와 상대를 따로 입력해서 관계의 균형, 갈등 포인트, 오늘의 접근법을 봐요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PersonFieldset title="첫 번째 사람" prefix="a" disabled={isPending} />
              <PersonFieldset title="두 번째 사람" prefix="b" disabled={isPending} />
            </div>

            {state.kind === "error" ? (
              <FormMessage
                state={{ kind: "error", message: state.message ?? "" }}
              />
            ) : null}

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  분석하는 중
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" aria-hidden />
                  두 사람 궁합 보기
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.kind === "success" && state.result ? (
        <div id="two-person-result" className="space-y-6">
          <TwoPersonResultCard result={state.result} />
          <CompatPurpose
            subscribed={subscribed}
            aName={state.result.aName}
            aBirthDate={state.result.aBirthDate}
            bName={state.result.bName}
            bBirthDate={state.result.bBirthDate}
            aMbti={state.result.aMbti}
            bMbti={state.result.bMbti}
          />
          <CompatConflict
            subscribed={subscribed}
            aName={state.result.aName}
            aBirthDate={state.result.aBirthDate}
            aGender={state.result.aGender}
            bName={state.result.bName}
            bBirthDate={state.result.bBirthDate}
            bGender={state.result.bGender}
            aMbti={state.result.aMbti}
            bMbti={state.result.bMbti}
          />
          <CompatToday
            subscribed={subscribed}
            aName={state.result.aName}
            bName={state.result.bName}
            compatScore={state.result.output.score}
            aMbti={state.result.aMbti}
            bMbti={state.result.bMbti}
          />
        </div>
      ) : null}
    </div>
  );
}

interface PersonFieldsetProps {
  title: string;
  prefix: "a" | "b";
  disabled: boolean;
}

function PersonFieldset({ title, prefix, disabled }: PersonFieldsetProps) {
  const id = (suffix: string): string => `${prefix}${suffix}`;
  const name = (suffix: string): string => `${prefix}${suffix}`;

  return (
    <fieldset className="space-y-4 rounded-xl app-surface p-4">
      <legend className="font-mystic px-2 text-[15px] font-semibold">
        {title}
      </legend>

      <div className="space-y-2">
        <Label htmlFor={id("Name")}>이름</Label>
        <Input
          id={id("Name")}
          name={name("Name")}
          type="text"
          maxLength={40}
          required
          placeholder="예: 서윤"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("BirthDate")}>생년월일</Label>
        <Input
          id={id("BirthDate")}
          name={name("BirthDate")}
          type="date"
          required
          max={TODAY_ISO()}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={id("CalendarSystem")}>달력</Label>
          <Select
            id={id("CalendarSystem")}
            name={name("CalendarSystem")}
            defaultValue="solar"
            required
            disabled={disabled}
          >
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("Gender")}>성별</Label>
          <Select
            id={id("Gender")}
            name={name("Gender")}
            required
            defaultValue=""
            disabled={disabled}
          >
            <option value="" disabled>
              선택
            </option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("Mbti")}>MBTI 선택 입력</Label>
        <Input
          id={id("Mbti")}
          name={name("Mbti")}
          type="text"
          maxLength={4}
          placeholder="예: INFP"
          className="uppercase"
          disabled={disabled}
        />
      </div>
    </fieldset>
  );
}

interface TwoPersonResultProps {
  result: NonNullable<TwoPersonCompatState["result"]>;
}

function TwoPersonResultCard({ result }: TwoPersonResultProps) {
  const { score } = result.output;
  const summary = safeReadingText(
    result.output.summary,
    "두 사람은 서로의 리듬을 이해할수록 관계가 안정되는 흐름이에요.",
  );
  const detail = safeReadingText(
    result.output.detail,
    "표현 방식의 차이를 먼저 인정하고, 서두르지 않는 대화가 관계를 더 편하게 만들어줘요.",
  );
  const aName = safeShortText(result.aName, "첫 번째 사람");
  const bName = safeShortText(result.bName, "두 번째 사람");

  return (
    <Card className="app-surface ring-1 ring-accent/15">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-mystic flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
            <Heart className="h-4 w-4 text-accent" aria-hidden />
            <span>{aName}</span>
            <span className="text-[13px] font-normal text-muted-foreground">
              ({result.aBirthDate})
            </span>
            <span className="text-muted-foreground">×</span>
            <span>{bName}</span>
            <span className="text-[13px] font-normal text-muted-foreground">
              ({result.bBirthDate})
            </span>
          </p>
          <ScoreBadge score={score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreGauge score={score} label="궁합 점수" />
        <div className="rounded-2xl border border-accent/20 bg-accent/[0.07] px-4 py-3">
          <p className="font-mystic text-lg font-medium leading-relaxed">
            {summary}
          </p>
        </div>
        <p className="whitespace-pre-line font-mystic text-[15px] leading-7 text-foreground/85">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const gaugeStyle = { "--gauge": `${clamped}%` } as React.CSSProperties;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mystic font-semibold text-foreground">
          {clamped} / 100
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-card"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        style={gaugeStyle}
      >
        <div className="h-full w-[var(--gauge)] rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-700 ease-out" />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-accent/30 bg-accent/15 text-accent"
      : score >= 50
        ? "border-primary/30 bg-primary/15 text-primary"
        : "border-destructive/20 bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "w-fit rounded-full border px-3 py-1 font-mystic text-[13px] font-medium",
        tone,
      )}
      aria-label={`궁합 점수 ${score}점`}
    >
      {score}점
    </span>
  );
}
