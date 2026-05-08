import type { Metadata } from "next";

/** Vercel Hobby 최대 허용치(30s) — AI 궁합 풀이 타임아웃 방지. */
export const maxDuration = 30;
import { Users } from "lucide-react";

import { CompatibilityCard } from "@/components/compatibility/compatibility-card";
import { CompatibilityForm } from "@/components/compatibility/compatibility-form";
import { CompatibilityHub } from "@/components/compatibility/compatibility-hub";
import { MbtiCompatPanel } from "@/components/compatibility/mbti-compat-panel";
import { SavedPartnerCard } from "@/components/compatibility/saved-partner-card";
import { TwoPersonCompat } from "@/components/compatibility/two-person-compat";
import { ZodiacCompatPanel } from "@/components/compatibility/zodiac-compat-panel";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getRecentCompatibility,
  getTodayCompatibilityForPartner,
} from "@/lib/compatibility/service";
import { listPartners } from "@/lib/compatibility/partners";
import { getZodiacSign } from "@/lib/fortunes/zodiac";
import type { PersonalityType } from "@/lib/personality/questions";

export const metadata: Metadata = {
  title: "관계 허브",
  description: "저장된 상대와의 궁합·별자리·MBTI 운명을 한눈에.",
};

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/;

export default async function CompatibilityPage() {
  const { profile } = await requireProfile();

  const [partners, recentReadings] = await Promise.all([
    listPartners(profile.userId),
    getRecentCompatibility(profile.userId, 5),
  ]);

  // 저장된 상대 각각에 대해 오늘자 풀이를 동시에 조회.
  const todayReadings = await Promise.all(
    partners.map((p) =>
      getTodayCompatibilityForPartner({
        userId: profile.userId,
        partnerName: p.name,
        partnerBirthDate: p.birthDate,
      }),
    ),
  );

  const myZodiac = getZodiacSign(profile.birthDate);
  const myMbti =
    profile.mbti && MBTI_PATTERN.test(profile.mbti.toUpperCase())
      ? (profile.mbti.toUpperCase() as PersonalityType)
      : null;

  const savedPanel = (
    <div className="space-y-4">
      {partners.length === 0 ? (
        <Card className="app-surface">
          <CardContent className="space-y-3 p-8 text-center">
            <Users
              className="mx-auto h-10 w-10 text-muted-foreground"
              aria-hidden
            />
            <p className="font-mystic text-base">
              아직 저장된 상대가 없어.
            </p>
            <p className="text-sm text-muted-foreground">
              &quot;새 궁합&quot; 탭에서 궁합을 보면서 함께 저장할 수 있어.
            </p>
          </CardContent>
        </Card>
      ) : (
        partners.map((p, i) => (
          <SavedPartnerCard
            key={p.id}
            partner={p}
            todayReading={todayReadings[i]}
          />
        ))
      )}
    </div>
  );

  const newPanel = (
    <div className="space-y-6">
      <CompatibilityForm />
      {recentReadings.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-mystic text-xl font-semibold tracking-tight">
            지난 궁합
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
          관계 허브
        </h1>
        <p className="text-sm text-muted-foreground">
          소중한 사람들과의 궁합·별자리·MBTI 를 한곳에서 살펴봐.
        </p>
      </header>

      <CompatibilityHub
        saved={savedPanel}
        newReading={newPanel}
        twoPerson={<TwoPersonCompat />}
        zodiac={<ZodiacCompatPanel myZodiac={myZodiac.id} />}
        mbti={<MbtiCompatPanel myMbti={myMbti} />}
      />
    </div>
  );
}
