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

export const metadata: Metadata = {
  title: "성격유형",
  description: "20문항으로 나의 성격 유형을 알아봐요.",
};

export default async function PersonalityPage() {
  const { profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          성격유형
        </h1>
        <p className="text-muted-foreground">
          20문항으로 나의 본성을 알아봐. 결과는 주술사 채팅·운세·타로 풀이에 자동 반영돼.
        </p>
      </header>

      <Card className="app-surface">
        <CardHeader className="pb-2">
          <CardTitle className="font-mystic text-lg">나는 어떤 유형?</CardTitle>
          <CardDescription className="text-xs">
            {profile.mbti
              ? `현재 유형: ${profile.mbti} — 다시 테스트하거나 그대로 유지할 수 있어.`
              : "아직 유형 테스트를 하지 않았어. 지금 바로 알아봐!"}
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
