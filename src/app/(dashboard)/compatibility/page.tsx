import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 궁합 풀이 타임아웃 방지. */
export const maxDuration = 30;

import { ChineseZodiacCompatPanel } from "@/components/compatibility/chinese-zodiac-compat-panel";
import { CompatibilityCard } from "@/components/compatibility/compatibility-card";
import { CompatibilityForm } from "@/components/compatibility/compatibility-form";
import { CompatibilityHub } from "@/components/compatibility/compatibility-hub";
import { MbtiCompatPanel } from "@/components/compatibility/mbti-compat-panel";
import { TwoPersonCompat } from "@/components/compatibility/two-person-compat";
import { ZodiacCompatPanel } from "@/components/compatibility/zodiac-compat-panel";
import { requireProfile } from "@/lib/auth/get-user";
import { getTodayCompatibility } from "@/lib/compatibility/service";
import { getChineseZodiac, getZodiacSign } from "@/lib/fortunes/zodiac";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import type { PersonalityType } from "@/lib/personality/questions";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tPage = await getTranslations("compatibilityPage");
  return { title: tPage("metaTitle"), description: tPage("metaDescription") };
}

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/;

export default async function CompatibilityPage() {
  const t = await getTranslations("compatibility");
  const tPage = await getTranslations("compatibilityPage");
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
            {tPage("todayHeading")}
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
          {t("title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("description")}
        </p>
      </header>

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
