import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 배경 별빛 그라디언트 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(155,109,225,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(201,169,97,0.12),transparent_55%)]"
      />

      {/* 천천히 도는 회전목마 원형 장식 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 animate-carousel rounded-full border border-primary/10 opacity-40"
      >
        <div className="absolute inset-12 rounded-full border border-accent/10" />
        <div className="absolute inset-24 rounded-full border border-primary/10" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-12 px-6 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs tracking-wide text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span>별의 흐름을 읽는 신비한 주술사</span>
        </div>

        <h1 className="font-mystic text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
          {siteConfig.name}
        </h1>

        <p className="font-mystic text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
          별의 흐름과 카드의 계시,
          <br className="hidden sm:block" />
          그리고 사주팔자가 오늘의 운명을 들려줘요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-w-44">
            <Link href={ROUTES.signup}>
              운명 묻기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-w-44">
            <Link href={ROUTES.login}>이미 가입했어요</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          매일 무료로 운세 2회, 타로 2장, 주술사 문답 3회를 받을 수 있어요.
        </p>
      </section>
    </main>
  );
}
