import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CareerFit } from "@/components/personality/career-fit";
import { PersonalityTest } from "@/components/personality/personality-test";
import { StressProfile } from "@/components/personality/stress-profile";
import { TripleAnalysis } from "@/components/personality/triple-analysis";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tPage = await getTranslations("personalityPage");
  return { title: tPage("metaTitle"), description: tPage("metaDescription") };
}

export default async function PersonalityPage() {
  const { profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId);
  const t = await getTranslations("personality");
  const tPage = await getTranslations("personalityPage");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <Card className="app-surface">
        <CardHeader className="pb-2">
          <CardTitle className="font-mystic text-lg">{tPage("title")}</CardTitle>
          <CardDescription className="text-[15px]">
            {profile.mbti
              ? tPage("bodyWithProfile")
              : tPage("bodyNoProfile")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonalityTest currentType={profile.mbti ?? null} />
        </CardContent>
      </Card>

      {profile.mbti ? (
        <div className="space-y-6">
          <TripleAnalysis subscribed={subscribed} />
          <StressProfile subscribed={subscribed} />
          <CareerFit subscribed={subscribed} />
        </div>
      ) : null}
    </div>
  );
}
