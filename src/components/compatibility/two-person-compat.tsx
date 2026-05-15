"use client";

/**
 * 타인 간 궁합 — 제3자 두 명(A, B)의 궁합을 분석한다.
 */
import { useActionState } from "react";
import { Heart, Loader2, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("twoPersonCompat");
  const tForm = useTranslations("compatibilityForm");

  useScrollToResult(isPending, "two-person-result", 200);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <UsersRound className="h-5 w-5 text-accent" aria-hidden />
            {t("heading")}
          </CardTitle>
          <CardDescription className="text-[15px]">
            {t("body")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PersonFieldset
                title={t("person1")}
                prefix="a"
                disabled={isPending}
              />
              <PersonFieldset
                title={t("person2")}
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
                  {tForm("submitLoading")}
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" aria-hidden />
                  {tForm("submitCta")}
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
  const tForm = useTranslations("compatibilityForm");

  return (
    <fieldset className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
      <legend className="font-mystic px-2 text-[15px] font-semibold">
        {title}
      </legend>

      <div className="space-y-2">
        <Label htmlFor={id("Name")}>{tForm("name")}</Label>
        <Input
          id={id("Name")}
          name={name("Name")}
          type="text"
          maxLength={40}
          required
          placeholder={tForm("namePlaceholder")}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("BirthDate")}>{tForm("birthDate")}</Label>
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
          <Label htmlFor={id("CalendarSystem")}>{tForm("calendar")}</Label>
          <Select
            id={id("CalendarSystem")}
            name={name("CalendarSystem")}
            defaultValue="solar"
            required
            disabled={disabled}
          >
            <option value="solar">{tForm("calendarSolar")}</option>
            <option value="lunar">{tForm("calendarLunar")}</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("Gender")}>{tForm("gender")}</Label>
          <Select
            id={id("Gender")}
            name={name("Gender")}
            required
            defaultValue=""
            disabled={disabled}
          >
            <option value="" disabled>
              {tForm("genderPick")}
            </option>
            <option value="male">{tForm("genderMale")}</option>
            <option value="female">{tForm("genderFemale")}</option>
            <option value="other">{tForm("genderOther")}</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("Mbti")}>{tForm("mbti")}</Label>
        <Input
          id={id("Mbti")}
          name={name("Mbti")}
          type="text"
          maxLength={4}
          placeholder={tForm("mbtiPlaceholder")}
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
  const t = useTranslations("twoPersonCompat");

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <p className="font-mystic text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" aria-hidden />
            <span>{result.aName}</span>
            <span className="text-[15px] text-muted-foreground font-normal">
              ({result.aBirthDate})
            </span>
            <span className="text-muted-foreground">×</span>
            <span>{result.bName}</span>
            <span className="text-[15px] text-muted-foreground font-normal">
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

  function ScoreGauge({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const gaugeStyle = { "--gauge": `${clamped}%` } as React.CSSProperties;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[15px] text-muted-foreground">
          <span>{t("score")}</span>
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
}

function ScoreBadge({ score }: { score: number }) {
  const t = useTranslations("twoPersonCompat");
  const tone =
    score >= 80
      ? "bg-accent/15 text-accent"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-0.5 font-mystic text-[15px] font-medium",
        tone,
      )}
      aria-label={t("scoreUnit", { n: score })}
    >
      {t("scoreUnit", { n: score })}
    </span>
  );
}
