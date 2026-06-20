import type { Metadata } from "next";

import { DreamReadingForm } from "@/components/dream/dream-reading-form";
import { requireProfile } from "@/lib/auth/get-user";

export const metadata: Metadata = {
  title: "꿈해몽",
  description: "기억나는 꿈을 현실적인 메시지로 풀어봐요.",
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
          어젯밤 꿈에 남은 장면을 적으면 상징, 감정, 오늘의 조언으로 정리해요.
        </p>
      </header>

      <DreamReadingForm />
    </div>
  );
}
