import type { Metadata } from "next";

import { FlowerOracleClient } from "@/components/flower-oracle/flower-oracle-client";
import { requireProfile } from "@/lib/auth/get-user";

export const metadata: Metadata = {
  title: "오늘의 꽃점",
  description: "오늘 마음에 어울리는 꽃과 짧은 메시지를 뽑아보세요.",
};

export default async function FlowerOraclePage() {
  await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          Floromancy
        </p>
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          오늘의 꽃점
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          지금 마음에 어울리는 꽃을 뽑고, 오늘을 가볍게 정리할 작은 힌트를 받아보세요.
        </p>
      </header>

      <FlowerOracleClient />
    </div>
  );
}
