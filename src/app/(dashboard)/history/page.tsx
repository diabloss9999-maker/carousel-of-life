import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireProfile } from "@/lib/auth/get-user";
import { getFateLog, getFateSummary } from "@/lib/history/fate-log";
import { getCrackScore } from "@/lib/crack/service";
import { FateLogView } from "@/components/history/fate-log-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("historyPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function HistoryPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("historyPage");

  const [crackData, entries] = await Promise.all([
    getCrackScore(profile.userId),
    getFateLog(profile.userId),
  ]);

  const fateSummary = await getFateSummary(profile.userId, crackData.score);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/eye-orbit.svg" alt="" aria-hidden className="h-8 w-8 opacity-60" />
          <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
            {t("category")}
          </p>
        </div>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("heading")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("metaDescription")}
        </p>
      </header>

      <FateLogView
        entries={entries}
        summary={fateSummary}
        crackLevel={crackData.level}
      />
    </div>
  );
}
