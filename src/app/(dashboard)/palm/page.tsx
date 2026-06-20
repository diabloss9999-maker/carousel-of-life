import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PalmUploadForm } from "@/components/palm/palm-upload-form";
import { requireProfile } from "@/lib/auth/get-user";

/** Vercel Hobby 최대 — Vision API 응답 시간 보장. */
export const maxDuration = 30;

export const metadata: Metadata = {
  title: "손금 풀이",
  description:
    "손바닥 사진을 올리면 태오가 주요 손금과 생활 습관을 함께 봐줘요. 사진은 풀이 뒤 바로 폐기돼요.",
};

export default async function PalmPage() {
  const t = await getTranslations("palmPage");
  // 인증 보장 — 미인증은 미들웨어/redirect 가 처리
  await requireProfile();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          PALM READING
        </p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <PalmUploadForm />
    </div>
  );
}
