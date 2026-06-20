import type { Metadata } from "next";

import { ChineseZodiacCompatPanel } from "@/components/compatibility/chinese-zodiac-compat-panel";
import { CompatibilityCard } from "@/components/compatibility/compatibility-card";
import { CompatibilityForm } from "@/components/compatibility/compatibility-form";
import { CompatibilityHub } from "@/components/compatibility/compatibility-hub";
import { MbtiCompatPanel } from "@/components/compatibility/mbti-compat-panel";
import { TwoPersonCompat } from "@/components/compatibility/two-person-compat";
import { ZodiacCompatPanel } from "@/components/compatibility/zodiac-compat-panel";
import { RelatableReadingCard } from "@/components/shared/relatable-reading-card";
import { requireProfile } from "@/lib/auth/get-user";
import { getTodayCompatibility } from "@/lib/compatibility/service";
import { getChineseZodiac, getZodiacSign } from "@/lib/fortunes/zodiac";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import type { PersonalityType } from "@/lib/personality/questions";

export const maxDuration = 30;

export const metadata: Metadata = {
  title: "궁합",
  description: "두 사람의 관계 흐름과 성향 차이를 현실적으로 정리해요.",
};

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/;

export default async function CompatibilityPage() {
  const { profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId);

  const recentReadings = await getTodayCompatibility(profile.userId);
  const myZodiac = getZodiacSign(profile.birthDate);
  const myChineseZodiac = getChineseZodiac(profile.birthDate);
  const myMbti =
    profile.mbti && MBTI_PATTERN.test(profile.mbti.toUpperCase())
      ? (profile.mbti.toUpperCase() as PersonalityType)
      : null;

  const newPanel = (
    <div className="space-y-6">
      <CompatibilityForm />
      {recentReadings.length > 0 ? (
        <section id="compat-result" className="space-y-4">
          <h2 className="font-mystic text-xl font-semibold tracking-tight">
            오늘 본 궁합
          </h2>
          <div className="space-y-4">
            {recentReadings.map((reading) => (
              <CompatibilityCard key={reading.id} reading={reading} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          궁합
        </h1>
        <p className="text-[15px] text-muted-foreground">
          이름, 생년월일, MBTI, 별자리 흐름으로 관계를 여러 각도에서 살펴봐요.
        </p>
      </header>

      <RelatableReadingCard kind="compatibility" />

      <CompatibilityHub
        newReading={newPanel}
        twoPerson={<TwoPersonCompat subscribed={subscribed} />}
        zodiac={<ZodiacCompatPanel myZodiac={myZodiac.id} />}
        chineseZodiac={
          <ChineseZodiacCompatPanel myChineseZodiac={myChineseZodiac.id} />
        }
        mbti={<MbtiCompatPanel myMbti={myMbti} />}
      />
    </div>
  );
}
