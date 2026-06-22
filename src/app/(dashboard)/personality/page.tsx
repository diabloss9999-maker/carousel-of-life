import type { Metadata } from "next";

import { PsychologicalTestsHub } from "@/components/personality/psychological-tests-hub";
import { requireProfile } from "@/lib/auth/get-user";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tPage = await getTranslations("personalityPage");
  return { title: tPage("metaTitle"), description: tPage("metaDescription") };
}

export default async function PersonalityPage() {
  await requireProfile();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          심리 테스트
        </h1>
        <p className="text-muted-foreground">
          연애, 감정, 관계, 선택 습관을 짧게 확인하고 결과를 공유해보세요.
        </p>
      </header>

      <PsychologicalTestsHub />
    </div>
  );
}
