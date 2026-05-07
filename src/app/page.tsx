import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 일러스트 배경 — 모바일 cover, 데스크톱은 가운데 contain. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <Image
          src="/mystic-bg.svg"
          alt=""
          fill
          priority
          className="object-cover object-center sm:object-contain"
        />
        {/* 데스크톱 좌우 빈 공간을 채울 보조 색상 */}
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(212,180,236,0.5)_0%,oklch(0.7_0.10_295)_60%,oklch(0.5_0.13_295)_100%)] sm:block hidden"
        />
      </div>

      {/* 위쪽 콘텐츠 영역 가독성용 부드러운 어두운 그라디언트 (덜 진하게) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3 bg-gradient-to-b from-background/30 via-transparent to-transparent"
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-start gap-8 px-6 pt-20 pb-40 text-center sm:justify-center sm:pt-12 sm:pb-12">
        <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs tracking-wide text-foreground backdrop-blur-md shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="font-medium drop-shadow-sm">
            별의 흐름을 읽는 신비한 주술사
          </span>
        </div>

        <h1 className="font-mystic text-balance text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl drop-shadow-[0_2px_8px_rgba(13,10,20,0.4)]">
          {siteConfig.name}
        </h1>

        <p className="font-mystic text-balance text-base leading-relaxed text-foreground/90 sm:text-lg drop-shadow-[0_1px_4px_rgba(13,10,20,0.4)]">
          별의 흐름과 카드의 계시,
          <br className="hidden sm:block" />
          그리고 사주팔자가 오늘의 운명을 들려줘요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row mt-2">
          <Button asChild size="lg" className="min-w-44 shadow-lg">
            <Link href={ROUTES.signup}>
              운명 묻기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-w-44 border-white/30 bg-white/15 backdrop-blur-md hover:bg-white/25"
          >
            <Link href={ROUTES.login}>이미 가입했어요</Link>
          </Button>
        </div>

        <p className="text-xs text-foreground/80 drop-shadow-sm">
          매일 무료로 운세 2회, 타로 2장, 주술사 문답 3회를 받을 수 있어요.
        </p>
      </section>
    </main>
  );
}
