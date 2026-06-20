"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, User } from "lucide-react";

import { breakSentences } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  readNameAction,
  type NameReadingActionState,
} from "@/app/(dashboard)/name-reading/actions";

const initial: NameReadingActionState = { kind: "idle" };

interface NameReadingFormProps {
  defaultName?: string;
}

export function NameReadingForm({ defaultName = "" }: NameReadingFormProps) {
  const t = useTranslations("nameReadingForm");
  const [state, formAction, isPending] = useActionState(readNameAction, initial);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" aria-hidden />
            {t("cardTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetName">
                {t("nameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetName"
                name="targetName"
                type="text"
                required
                maxLength={20}
                defaultValue={defaultName}
                placeholder={t("namePlaceholder")}
                disabled={isPending}
              />
              <p className="text-[15px] text-muted-foreground">
                {t("nameHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hanja">{t("hanjaLabel")}</Label>
              <Input
                id="hanja"
                name="hanja"
                type="text"
                maxLength={20}
                placeholder={t("hanjaPlaceholder")}
                disabled={isPending}
              />
              <p className="text-[15px] text-muted-foreground">
                {t("hanjaHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isOwnName">{t("ownerLabel")}</Label>
              <Select id="isOwnName" name="isOwnName" defaultValue="true" disabled={isPending}>
                <option value="true">{t("ownerSelf")}</option>
                <option value="false">{t("ownerOther")}</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("loading")}
                </>
              ) : (
                t("submit")
              )}
            </Button>

            {state.kind === "error" && (
              <p className="text-[15px] text-destructive">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {state.kind === "result" && (
        <NameReadingResultCard reading={state.reading} />
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-muted-foreground";
  return "text-rose-400";
}

function NameReadingResultCard({
  reading,
}: {
  reading: NonNullable<Extract<NameReadingActionState, { kind: "result" }>>["reading"];
}) {
  const t = useTranslations("nameReadingForm");
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-baseline gap-3 text-2xl">
          <span className={scoreColor(reading.score)}>{t("score", { n: reading.score })}</span>
          <span className="text-[15px] text-muted-foreground font-normal">
            {reading.summary}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-[15px] leading-relaxed">
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            {t("meaningTitle")}
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {breakSentences(reading.meaning)}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            {t("sajuHarmonyTitle")}
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {breakSentences(reading.sajuHarmony)}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            {t("fortuneTitle")}
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {breakSentences(reading.fortune)}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            {t("adviceTitle")}
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {breakSentences(reading.advice)}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
