import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 궁합 풀이 타임아웃 방지. */
export const maxDuration = 30;

import { CompatibilityCard } from "@/components/compatibility/compatibility-card";
import { CompatibilityForm } from "@/components/compatibility/compatibility-form";
import { CompatibilityHub } from "@/components/compatibility/compatibility-hub";
import { MbtiCompatPanel } from "@/components/compatibility/mbti-compat-panel";
import { TwoPersonCompat } from "@/components/compatibility/two-person-compat";
import { ZodiacCompatPanel } from "@/components/compatibility/zodiac-compat-panel";
import { requireProfile } from "@/lib/auth/get-user";
import { getTodayCompatibility } from "@/lib/compatibility/service";
import { getZodiacSign } from "@/lib/fortunes/zodiac";
import type { PersonalityType } from "@/lib/personality/questions";

export const metadata: Metadata = {
  title: "궁합",
  description: "사주·별자리·성격유형으로 보는 궁합 풀이.",
};

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/;

export default async function CompatibilityPage() {
  const { profile } = await requireProfile();

  const recentReadings = await getTodayCompatibility(profile.userId);

  const myZodiac = getZodiacSign(profile.birthDate);
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
            오늘의 궁합
          </h2>
          <div className="space-y-4">
            {recentReadings.map((r) => (
              <CompatibilityCard key={r.id} reading={r} />
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
        <p className="text-sm text-muted-foreground">
          사주·별자리·성격유형으로 두 사람의 운명을 살펴봐.
        </p>
      </header>

      <CompatibilityHub
        newReading={newPanel}
        twoPerson={<TwoPersonCompat />}
        zodiac={<ZodiacCompatPanel myZodiac={myZodiac.id} />}
        mbti={<MbtiCompatPanel myMbti={myMbti} />}
      />
    </div>
  );
}
