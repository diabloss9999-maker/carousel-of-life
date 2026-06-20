import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireProfile } from "@/lib/auth/get-user";
import { NameReadingForm } from "@/components/name-reading/name-reading-form";

export const metadata: Metadata = {
  title: "이름풀이",
  description: "한자·획수·오행과 사주를 함께 살펴 이름을 읽어봐요.",
};

export default async function NameReadingPage() {
  const t = await getTranslations("nameReadingPage");
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <NameReadingForm defaultName={profile.displayName ?? ""} />
    </div>
  );
}
