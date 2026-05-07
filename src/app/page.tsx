import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  // 랜딩은 사이트 기본 타이틀 그대로 노출 (template 우회).
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description:
    "AI 가 사주팔자·타로·MBTI 를 통합해 매일의 운명을 풀이해드려요. 가입 후 매일 무료로 운세 2회·타로 2장·주술사 문답 3회를 받아볼 수 있어요.",
  alternates: {
    canonical: "/",
  },
};

/**
 * 검색엔진용 JSON-LD 구조화 데이터.
 * WebSite + Organization 두 타입을 한 번에 노출.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      alternateName: siteConfig.englishName,
      description: siteConfig.description,
      inLanguage: "ko-KR",
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      sameAs: [],
    },
    {
      "@type": "WebApplication",
      name: siteConfig.name,
      url: siteConfig.url,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
        description: "무료 가입 후 매일 운세 2회·타로 2장·주술사 문답 3회 제공",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        // 정적 객체를 직렬화하는 표준 JSON-LD 패턴. </script> 시퀀스를 이스케이프해 인젝션 방지.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      {/* 랜딩에서는 layout 의 가독성 오버레이를 살짝 옅게 (일러스트 강조) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5] bg-gradient-to-t from-background/30 via-transparent to-background/15"
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
