import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 모바일 배경 (세로) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 sm:hidden"
      >
        <Image
          src="/mystic-bg-mobile.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* 데스크톱 배경 (가로) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 hidden sm:block"
      >
        <Image
          src="/mystic-bg-wide.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* 콘텐츠 가독성용 부드러운 그라디언트 (위쪽 살짝 어둡게) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-background/15 to-transparent"
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-start gap-7 px-6 pt-20 pb-40 text-center sm:justify-center sm:pt-12 sm:pb-12">
        <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/25 px-4 py-1.5 text-xs tracking-wide text-foreground backdrop-blur-md shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="font-medium drop-shadow-sm">
            별의 흐름을 읽는 신비한 주술사
          </span>
        </div>

        <h1 className="font-mystic text-balance text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl drop-shadow-[0_2px_8px_rgba(60,30,100,0.3)]">
          {siteConfig.name}
        </h1>

        <p className="font-mystic text-balance text-base leading-relaxed text-foreground/90 sm:text-lg drop-shadow-[0_1px_4px_rgba(60,30,100,0.25)]">
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
            className="min-w-44 border-white/40 bg-white/25 backdrop-blur-md hover:bg-white/35"
          >
            <Link href={ROUTES.login}>이미 가입했어요</Link>
          </Button>
        </div>

        <p className="text-xs text-foreground/85 drop-shadow-sm">
          매일 무료로 운세 2회, 타로 2장, 주술사 문답 3회를 받을 수 있어요.
        </p>
      </section>
    </main>
  );
}
