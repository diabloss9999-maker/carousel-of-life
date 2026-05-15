"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Heart, Loader2 } from "lucide-react";
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
import { ROUTES } from "@/lib/constants";
import {
  submitCompatibilityAction,
  type CompatibilityActionState,
} from "@/app/(dashboard)/compatibility/actions";

const initial: CompatibilityActionState = { kind: "idle" };

export function CompatibilityForm() {
  const [state, formAction, isPending] = useActionState(
    submitCompatibilityAction,
    initial,
  );
  const t = useTranslations("compatibilityForm");

  useScrollToResult(isPending, "compat-result", 800);

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-accent" aria-hidden />
          {t("heading")}
        </CardTitle>
        <CardDescription className="text-[15px]">
          {t("body")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partnerName">
              {t("name")}
            </Label>
            <Input
              id="partnerName"
              name="partnerName"
              type="text"
              maxLength={40}
              required
              placeholder={t("namePlaceholder")}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerBirthDate">
                {t("birthDate")}
              </Label>
              <Input
                id="partnerBirthDate"
                name="partnerBirthDate"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerBirthTime">{t("birthTime")}</Label>
              <Input
                id="partnerBirthTime"
                name="partnerBirthTime"
                type="time"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerCalendarSystem">
                {t("calendar")}
              </Label>
              <Select
                id="partnerCalendarSystem"
                name="partnerCalendarSystem"
                defaultValue="solar"
                required
                disabled={isPending}
              >
                <option value="solar">{t("calendarSolar")}</option>
                <option value="lunar">{t("calendarLunar")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerGender">
                {t("gender")}
              </Label>
              <Select
                id="partnerGender"
                name="partnerGender"
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

          <div className="space-y-2">
            <Label htmlFor="partnerMbti">{t("mbti")}</Label>
            <Input
              id="partnerMbti"
              name="partnerMbti"
              type="text"
              maxLength={4}
              placeholder={t("mbtiPlaceholder")}
              className="uppercase"
              disabled={isPending}
            />
          </div>

          {state.kind === "error" ? (
            <div className="space-y-2">
              <FormMessage
                state={{ kind: "error", message: state.message ?? "" }}
              />
              {state.quotaExceeded ? (
                <Button asChild className="w-full" variant="outline">
                  <Link href={ROUTES.pricing}>{t("upgradeCta")}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          {state.kind === "done" ? (
            <p className="text-[15px] text-center text-emerald-500 font-medium">
              {t("doneNotice")}
            </p>
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
                {t("submitLoading")}
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" aria-hidden />
                {t("submitCta")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
