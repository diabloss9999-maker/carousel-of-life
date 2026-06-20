"use client";

import { useActionState } from "react";
import {
  CalendarDays,
  Compass,
  Loader2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
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

const START_OPTIONS: Array<{
  body: string;
  icon: LucideIcon;
  title: string;
  value: "today" | "tarot" | "saju";
}> = [
  {
    body: "오늘 하루 흐름부터 바로 확인해요.",
    icon: CalendarDays,
    title: "오늘운세",
    value: "today",
  },
  {
    body: "마음에 걸리는 질문을 카드로 살펴봐요.",
    icon: Sparkles,
    title: "타로",
    value: "tarot",
  },
  {
    body: "내 기질과 오행 균형부터 정리해요.",
    icon: Compass,
    title: "사주",
    value: "saju",
  },
];

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
          <p className="text-[15px] text-muted-foreground">
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

      <fieldset className="space-y-3">
        <div className="space-y-1">
          <legend className="text-[14px] font-semibold text-foreground">
            처음 무엇을 볼까요?
          </legend>
          <p className="text-[13px] leading-5 text-muted-foreground">
            프로필 저장 후 선택한 화면으로 바로 이동해요.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {START_OPTIONS.map(({ body, icon: Icon, title, value }) => (
            <label
              key={value}
              className="group relative min-h-[116px] cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-primary/40 hover:bg-white/[0.07]"
            >
              <input
                className="peer sr-only"
                type="radio"
                name="startWith"
                value={value}
                defaultChecked={value === "today"}
                disabled={isPending}
              />
              <span
                className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-primary/0 transition peer-checked:ring-2 peer-checked:ring-primary/55"
                aria-hidden
              />
              <span className="relative flex h-full flex-col gap-2">
                <span className="flex items-center gap-2 text-primary">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="text-[13px] font-semibold text-foreground">
                    {title}
                  </span>
                </span>
                <span className="text-[13px] leading-5 text-muted-foreground">
                  {body}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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

      <p className="text-center text-[15px] text-muted-foreground">
        {t("privacy")}
      </p>
    </form>
  );
}
