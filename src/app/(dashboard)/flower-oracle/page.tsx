import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/get-user";
import { FlowerOracleClient } from "@/components/flower-oracle/flower-oracle-client";

export const metadata: Metadata = {
  title: "플로로랜시 — 오늘의 꽃",
  description:
    "꽃말의 결로 오늘 하루를 풀어드려요. 한 송이의 꽃이 당신에게 건네는 짧은 한 마디.",
};

export default async function FlowerOraclePage() {
  await requireProfile();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          Florolancy · 플라워 오라클
        </p>
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          오늘의 꽃
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          60종의 꽃 중 한 송이가 당신에게 건네는 짧은 한 마디.
          <br className="hidden sm:inline" />
          꽃말의 결을 사주와 엮어 오늘의 흐름을 읽어드려요.
        </p>
      </header>

      <FlowerOracleClient />
    </div>
  );
}
