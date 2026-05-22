import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/get-user";
import { DreamReadingForm } from "@/components/dream/dream-reading-form";

export const metadata: Metadata = {
  title: "꿈해몽",
  description: "꿈을 사주와 결합해 풀이해드려요.",
};

export default async function DreamPage() {
  await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          꿈해몽
        </h1>
        <p className="text-[15px] text-muted-foreground">
          어젯밤·최근에 꿨던 꿈을 적어주세요. 당신의 사주와 결합해 풀이해드려요.
        </p>
      </header>

      <DreamReadingForm />
    </div>
  );
}
