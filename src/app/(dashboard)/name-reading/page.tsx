import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/get-user";
import { NameReadingForm } from "@/components/name-reading/name-reading-form";

export const metadata: Metadata = {
  title: "이름풀이",
  description: "한자·획수·오행과 사주를 결합해 이름을 풀이해드려요.",
};

export default async function NameReadingPage() {
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          이름풀이
        </h1>
        <p className="text-[15px] text-muted-foreground">
          한자·획수·오행과 당신의 사주를 결합해 이름의 결을 짚어드려요.
        </p>
      </header>

      <NameReadingForm defaultName={profile.displayName ?? ""} />
    </div>
  );
}
