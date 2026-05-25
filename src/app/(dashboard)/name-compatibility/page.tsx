import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/get-user";
import { NameCompatibilityForm } from "@/components/name-compatibility/name-compatibility-form";

export const metadata: Metadata = {
  title: "이름 궁합",
  description:
    "두 사람의 이름만으로 궁합을 짚어드려요. 한글 자음의 결과 점술사의 한 마디.",
};

export default async function NameCompatibilityPage() {
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          이름 궁합
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          두 사람의 이름만으로 궁합을 짚어드려요.
          <br className="hidden sm:inline" /> 자음의 결과 소리의 울림을 읽어 점수와 한 마디를 들려드립니다.
        </p>
      </header>

      <NameCompatibilityForm defaultMyName={profile.displayName ?? ""} />
    </div>
  );
}
