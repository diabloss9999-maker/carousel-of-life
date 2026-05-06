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

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await getProfile(user.id);
  if (existing) {
    redirect(ROUTES.today);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="border-border/60 bg-card/60 backdrop-blur">
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
            initialDisplayName={
              (user.user_metadata?.display_name as string | undefined) ?? ""
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
