import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, MessagesSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  // 랜딩은 사이트 기본 타이틀 그대로 노출 (template 우회).
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description:
    "AI 가 사주팔자·타로·성격유형을 통합해 매일의 운명을 풀이해드려요. 가입 후 매일 무료로 운세 3회·타로 3장·주술사 문답 3회를 받아볼 수 있어요.",
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
    <main className="relative min-h-screen">
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
            <Link href={ROUTES.login}>
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
          매일 무료로 운세 2회, 타로 2장, 주술사 문답 10회를 받을 수 있어요.
        </p>

        <Link
          href={ROUTES.pricing}
          className="text-sm text-foreground/80 underline underline-offset-4 hover:text-foreground"
        >
          유료 플랜 보기
        </Link>
      </section>

      <ValuePropsSection />
      <PreviewSection />
      <FaqSection />

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-8 text-center">
        <Button asChild size="lg" className="min-w-48 shadow-lg">
          <Link href={ROUTES.login}>
            지금 무료로 시작하기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </main>
  );
}

/** 차별점 3카드 섹션. */
function ValuePropsSection() {
  const items = [
    {
      icon: Layers,
      title: "사주 + 타로 + 성격유형 통합",
      body:
        "다른 곳은 하나만 봅니다. 우리는 세 가지 시선으로 같은 흐름을 읽어드려요.",
    },
    {
      icon: MessagesSquare,
      title: "AI 주술사와의 대화",
      body:
        "단순 풀이가 아니라 아홉 명의 주술사가 각자의 방식으로 답해줍니다. 이세계의 카드, 동양의 사주·천기, 북방의 룬까지.",
    },
    {
      icon: Sparkles,
      title: "매일 무료로 받는 흐름",
      body:
        "가입만 하면 매일 운세 2회·타로 1장·주술사 문답 10회를 무료로.",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-5xl space-y-6 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          왜 인생의 회전목마인가
        </h2>
        <p className="text-sm text-muted-foreground">
          다른 운세 서비스와 다른 세 가지
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="h-full">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">{body}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** 결과물 미리보기 섹션 (예시 카드 2장). */
function PreviewSection() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl space-y-6 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          오늘의 운명, 이렇게 풀어드려요
        </h2>
        <p className="text-xs text-muted-foreground">아래는 예시입니다</p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* 타로 미리보기 */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">타로 한 장</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                예시
              </span>
            </div>
            <CardDescription className="text-xs">The Star · 별의 인도</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mx-auto h-44 w-28 overflow-hidden rounded-lg ring-1 ring-border">
              <Image
                src="/tarot/the_star.png"
                alt="타로 The Star 카드"
                width={224}
                height={352}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              오래 흐려 있던 마음에 다시 빛이 닿아요. 무리해서 결론 내지 말고,
              지금은 회복의 시간을 천천히 받아들여요. 작은 희망을 발견하는 것이
              오늘의 시작입니다.
            </p>
          </CardContent>
        </Card>

        {/* 운세 미리보기 */}
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">오늘의 운세</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                예시
              </span>
            </div>
            <CardDescription className="text-xs">사주 + 일진 통합 풀이</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium leading-relaxed">
              조급함을 내려놓을수록 길이 보이는 하루.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              계획대로 풀리지 않더라도 흔들리지 마세요. 오늘은 결단보다 관찰이
              유리합니다. 가까운 사람의 한마디에 단서가 있을 수 있어요.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["회복", "기다림", "별빛"].map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary"
                >
                  #{k}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/** 자주 묻는 질문 섹션. */
function FaqSection() {
  const faqs: { q: string; a: string }[] = [
    {
      q: "정말 무료인가요?",
      a: "네. 가입만 하면 매일 운세 2회·타로 1장·주술사 문답 10회를 무료로 받으실 수 있어요. 더 많은 풀이를 원하시면 라이트(₩4,900) 또는 프로(₩9,900) 멤버십을 선택할 수 있습니다.",
    },
    {
      q: "사주 정보는 어떻게 입력하나요?",
      a: "가입 직후 안내되는 온보딩에서 생년월일과 태어난 시각을 입력하시면, 사주팔자가 자동으로 계산되어 저장돼요. 한 번만 입력하면 됩니다.",
    },
    {
      q: "AI 풀이는 얼마나 정확한가요?",
      a: "사주·타로·성격유형이라는 세 가지 시선을 통합해 해석하므로 단편적인 운세보다 입체적이에요. 다만 결정의 도구가 아니라 흐름을 읽는 참고로 봐주세요.",
    },
    {
      q: "결제는 어떻게 진행되나요?",
      a: "Lemon Squeezy를 통한 안전한 카드 결제로, 매월 자동 갱신됩니다. 언제든지 설정 페이지에서 취소 가능합니다.",
    },
    {
      q: "탈퇴/환불 정책은?",
      a: "설정 페이지에서 언제든 구독을 취소할 수 있고, 다음 결제일 전에 취소하시면 더 이상 청구되지 않아요. 환불은 첫 결제 7일 이내 요청 시 가능합니다.",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-2xl space-y-6 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          자주 묻는 질문
        </h2>
      </div>
      <div className="space-y-2">
        {faqs.map(({ q, a }) => (
          <details
            key={q}
            className="app-surface group rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
              <span>{q}</span>
              <span
                aria-hidden
                className="text-muted-foreground transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
