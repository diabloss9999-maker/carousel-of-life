import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { getProfile, requireUser } from "@/lib/auth/get-user";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "프로필 입력",
  description: "사주 풀이를 위해 당신의 정보를 알려주세요.",
};

/**
 * Supabase user_metadata 에서 표시 이름 후보를 추출한다.
 *
 * - 카카오 OAuth: 카카오 프로필 닉네임이 `name` 또는 `full_name` 으로 저장됨.
 * - 구글 OAuth: `full_name` 또는 `name` 키로 저장됨.
 * - 폴백 체인으로 처리.
 */
function pickDisplayName(meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return "";
  const candidates = ["display_name", "name", "full_name", "nickname"];
  for (const key of candidates) {
    const value = meta[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

export default async function OnboardingPage() {
  const t = await getTranslations("onboardingPage");
  const user = await requireUser();
  const existing = await getProfile(user.id);
  if (existing) {
    redirect(ROUTES.appHome as Route);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="app-surface">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-mystic text-2xl">
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm
            initialDisplayName={pickDisplayName(user.user_metadata)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
