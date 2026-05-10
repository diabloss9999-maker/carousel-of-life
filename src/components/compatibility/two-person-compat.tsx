"use client";

/**
 * 타인 간 궁합 — 제3자 두 명(A, B)의 궁합을 분석한다.
 *
 * 입력만 받아 AI 풀이 결과를 즉석에서 보여주며 DB에 저장하지 않는다.
 */
import { useActionState } from "react";
import { Heart, Loader2, UsersRound } from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  twoPersonCompatAction,
  type TwoPersonCompatState,
} from "@/app/(dashboard)/compatibility/actions";
import { CompatPurpose } from "@/components/compatibility/compat-purpose";
import { CompatConflict } from "@/components/compatibility/compat-conflict";
import { CompatToday } from "@/components/compatibility/compat-today";

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
            타인 간 궁합
          </CardTitle>
          <CardDescription className="text-xs">
            두 사람의 정보를 입력하면 AI 가 궁합을 분석해 드려요. 결혼·친구·비즈니스 파트너 적합성 검토에 좋아.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PersonFieldset
                title="첫 번째 사람"
                prefix="a"
                disabled={isPending}
              />
              <PersonFieldset
                title="두 번째 사람"
                prefix="b"
                disabled={isPending}
              />
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
                  두 사람의 기운을 견주는 중…
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" aria-hidden />
                  궁합 분석하기
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
  /** 폼 필드 prefix — "a" 또는 "b". */
  prefix: "a" | "b";
  disabled: boolean;
}

function PersonFieldset({ title, prefix, disabled }: PersonFieldsetProps) {
  const id = (suffix: string): string => `${prefix}${suffix}`;
  const name = (suffix: string): string => `${prefix}${suffix}`;

  return (
    <fieldset className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
      <legend className="font-mystic px-2 text-sm font-semibold">
        {title}
      </legend>

      <div className="space-y-2">
        <Label htmlFor={id("Name")}>
          이름 <span className="text-destructive">*</span>
        </Label>
        <Input
          id={id("Name")}
          name={name("Name")}
          type="text"
          maxLength={40}
          required
          placeholder="이름"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("BirthDate")}>
          생년월일 <span className="text-destructive">*</span>
        </Label>
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
          <Label htmlFor={id("CalendarSystem")}>
            달력 <span className="text-destructive">*</span>
          </Label>
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
          <Label htmlFor={id("Gender")}>
            성별 <span className="text-destructive">*</span>
          </Label>
          <Select
            id={id("Gender")}
            name={name("Gender")}
            required
            defaultValue=""
            disabled={disabled}
          >
            <option value="" disabled>
              골라줘
            </option>
            <option value="male">남</option>
            <option value="female">여</option>
            <option value="other">기타</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("Mbti")}>MBTI</Label>
        <Input
          id={id("Mbti")}
          name={name("Mbti")}
          type="text"
          maxLength={4}
          placeholder="예: ENFP"
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
  const { score, summary, detail } = result.output;

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <p className="font-mystic text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" aria-hidden />
            <span>{result.aName}</span>
            <span className="text-xs text-muted-foreground font-normal">
              ({result.aBirthDate})
            </span>
            <span className="text-muted-foreground">×</span>
            <span>{result.bName}</span>
            <span className="text-xs text-muted-foreground font-normal">
              ({result.bBirthDate})
            </span>
          </p>
          <ScoreBadge score={score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreGauge score={score} />
        <p className="font-mystic text-lg leading-relaxed font-medium">
          {summary}
        </p>
        <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/85">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-0.5 font-mystic text-sm font-medium",
        tone,
      )}
      aria-label={`궁합 점수 ${score}점`}
    >
      {score}점
    </span>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  // Tailwind 4 의 arbitrary value + CSS 변수로 동적 width 처리.
  const gaugeStyle = { "--gauge": `${clamped}%` } as React.CSSProperties;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>궁합 점수</span>
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
