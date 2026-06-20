import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireProfile } from "@/lib/auth/get-user";
import { NameCompatibilityForm } from "@/components/name-compatibility/name-compatibility-form";

export const metadata: Metadata = {
  title: "이름 궁합",
  description:
    "Name compatibility based on the rhythm of two names.",
};

export default async function NameCompatibilityPage() {
  const t = await getTranslations("nameCompatibilityPage");
  const { profile } = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {t("descriptionLine1")}
          <br className="hidden sm:inline" /> {t("descriptionLine2")}
        </p>
      </header>

      <NameCompatibilityForm defaultMyName={profile.displayName ?? ""} />
    </div>
  );
}
