/**
 * 기억 보관소 — 사이의 결가 사용자에 대해 기억하고 있는 것들.
 *
 * 서버 컴포넌트로 친밀도/흐림 데이터를 끌어와
 * ArchivePanel(클라이언트)에 넘긴다.
 */
import type { Metadata } from "next";

import { ArchivePanel } from "@/components/archive/archive-panel";
import { requireProfile } from "@/lib/auth/get-user";
import { getAllAffinities } from "@/lib/affinity/service";
import { getCrackScore } from "@/lib/crack/service";

export const metadata: Metadata = {
  title: "기억 보관소",
  description: "사이의 결가 당신에 대해 기억하고 있는 것들.",
};

export default async function ArchivePage() {
  const { profile } = await requireProfile();

  const [affinities, crackData] = await Promise.all([
    getAllAffinities(profile.userId),
    getCrackScore(profile.userId),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          사이의 결 · 존재의 기록
        </p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight">
          기억 보관소
        </h1>
        <p className="text-[15px] text-muted-foreground">
          세계가 당신에 대해 기억하고 있는 것들.
        </p>
      </header>

      <ArchivePanel
        affinities={affinities}
        crackLevel={crackData.level}
      />
    </div>
  );
}
