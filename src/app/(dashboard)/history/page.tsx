import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/get-user";
import { getFateLog, getFateSummary } from "@/lib/history/fate-log";
import { getCrackScore } from "@/lib/crack/service";
import { FateLogView } from "@/components/history/fate-log-view";

export const metadata: Metadata = {
  title: "운명 로그",
  description: "당신이 지나온 흔적. 경계가 기억하고 있어.",
};

export default async function HistoryPage() {
  const { profile } = await requireProfile();

  const [crackData, entries, summary] = await Promise.all([
    getCrackScore(profile.userId),
    getFateLog(profile.userId),
    Promise.resolve(null), // summary는 클라이언트 로드
  ]);

  const fateSummary = await getFateSummary(profile.userId, crackData.score);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/eye-orbit.svg" alt="" aria-hidden className="h-8 w-8 opacity-60" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            경계(境界) · 기억의 층
          </p>
        </div>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          운명 로그
        </h1>
        <p className="text-sm text-muted-foreground">
          당신이 지나온 흔적. 경계가 기억하고 있어.
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
