import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "공유된 운세를 찾지 못했어요",
  robots: { index: false, follow: false },
};

export default function ShareFortuneNotFound() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <Sparkles
        className="h-10 w-10 text-muted-foreground/70"
        aria-hidden
      />
      <h1 className="font-mystic text-2xl font-semibold tracking-tight">
        별의 흔적이 흐려졌어요
      </h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        공유받은 링크가 만료되었거나 삭제되었어요.
        <br />
        나만의 오늘 운세를 직접 받아볼 수 있어요.
      </p>
      <Button asChild size="default" className="mt-2">
        <Link href="/">인생의 회전목마 시작하기</Link>
      </Button>
    </main>
  );
}
