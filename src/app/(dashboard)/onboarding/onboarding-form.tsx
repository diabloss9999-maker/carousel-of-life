"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  onboardingAction,
  type OnboardingFormState,
} from "@/lib/auth/onboarding-action";

const initial: OnboardingFormState = { kind: "idle" };

interface OnboardingFormProps {
  initialDisplayName?: string;
}

export function OnboardingForm({
  initialDisplayName = "",
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    onboardingAction,
    initial,
  );
  const t = useTranslations("onboardingForm");

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">
          {t("name")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={40}
          defaultValue={initialDisplayName}
          placeholder={t("namePlaceholder")}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birthDate">
            {t("birthDate")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthTime">{t("birthTime")}</Label>
          <Input
            id="birthTime"
            name="birthTime"
            type="time"
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            {t("birthTimeHelp")}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="calendarSystem">
            {t("calendarSystem")} <span className="text-destructive">*</span>
          </Label>
          <Select
            id="calendarSystem"
            name="calendarSystem"
            defaultValue="solar"
            required
            disabled={isPending}
          >
            <option value="solar">{t("calendarSolar")}</option>
            <option value="lunar">{t("calendarLunar")}</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">
            {t("gender")} <span className="text-destructive">*</span>
          </Label>
          <Select
            id="gender"
            name="gender"
            required
            defaultValue=""
            disabled={isPending}
          >
            <option value="" disabled>
              {t("genderPick")}
            </option>
            <option value="male">{t("genderMale")}</option>
            <option value="female">{t("genderFemale")}</option>
            <option value="other">{t("genderOther")}</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mbti">{t("mbti")}</Label>
          <Input
            id="mbti"
            name="mbti"
            type="text"
            maxLength={4}
            placeholder={t("mbtiPlaceholder")}
            className="uppercase"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthPlace">{t("birthplace")}</Label>
          <Input
            id="birthPlace"
            name="birthPlace"
            type="text"
            maxLength={80}
            placeholder={t("birthplacePlaceholder")}
            disabled={isPending}
          />
        </div>
      </div>

      <FormMessage
        state={
          state.kind === "error"
            ? { kind: "error", message: state.message ?? "" }
            : { kind: "idle" }
        }
      />

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("submitLoading")}
          </>
        ) : (
          t("submit")
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("privacy")}
      </p>
    </form>
  );
}
