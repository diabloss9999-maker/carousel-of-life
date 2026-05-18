import type { Metadata } from "next";

import { PalmUploadForm } from "@/components/palm/palm-upload-form";
import { requireProfile } from "@/lib/auth/get-user";

/** Vercel Hobby 최대 — Vision API 응답 시간 보장. */
export const maxDuration = 30;

export const metadata: Metadata = {
  title: "손금 풀이",
  description:
    "손바닥 사진을 올리면 이세계 주술사가 손금을 읽어줘요. 분석 후 사진은 즉시 폐기.",
};

export default async function PalmPage() {
  // 인증 보장 — 미인증은 미들웨어/redirect 가 처리
  await requireProfile();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          PALM READING
        </p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight">
          손금 풀이
        </h1>
        <p className="text-[15px] text-muted-foreground">
          이세계 주술사가 너의 손바닥에 새겨진 선을 읽어줘. 사진은 분석 즉시 폐기돼.
        </p>
      </header>

      <PalmUploadForm />
    </div>
  );
}
