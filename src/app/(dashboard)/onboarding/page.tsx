import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
 * - 이메일 가입: `display_name` 로 저장됨 (signupAction 참고).
 * - 카카오 OAuth: 카카오 프로필 닉네임이 `name` 또는 `full_name` 으로 저장됨.
 * - 다른 OAuth 도 비슷한 키를 쓰므로 폴백 체인으로 처리.
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
  const user = await requireUser();
  const existing = await getProfile(user.id);
  if (existing) {
    redirect(ROUTES.today);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="app-surface">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-mystic text-2xl">
            당신을 알려주세요
          </CardTitle>
          <CardDescription>
            사주 풀이를 위해 태어난 때를 알려주세요.
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
