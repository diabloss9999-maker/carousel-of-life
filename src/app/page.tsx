import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Heart,
  Layers,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CHARACTERS,
  CHARACTERS_BY_CATEGORY,
  type CharacterId,
} from "@/lib/chat/characters";
import {
  ROUTES,
  SUBSCRIPTION,
  FREE_DAILY_LIMITS,
  LITE_DAILY_LIMITS,
  PRO_DAILY_LIMITS,
} from "@/lib/constants";
import { formatKRW } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  // 랜딩은 사이트 기본 타이틀 그대로 노출 (template 우회).
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description:
    "AI 가 사주팔자·타로·성격유형을 통합해 매일의 운명을 풀이해드려요. 가입 후 매일 무료로 운세 2회·타로 1장·주술사 문답 10회를 받아볼 수 있어요.",
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
        description: "무료 가입 후 매일 운세 2회·타로 1장·주술사 문답 10회 제공",
      },
    },
  ],
};

export default async function HomePage() {
  const t = await getTranslations("landing");
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

      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-start gap-6 px-6 pt-20 pb-40 text-center sm:justify-center sm:pt-12 sm:pb-12">
        <h1 className="font-mystic text-balance text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl drop-shadow-[0_2px_8px_rgba(60,30,100,0.3)]">
          {siteConfig.name}
        </h1>

        <p className="font-mystic text-balance text-base leading-relaxed text-foreground/90 sm:text-lg drop-shadow-[0_1px_4px_rgba(60,30,100,0.25)]">
          {t("tagline")}
        </p>

        {/* 페이지 설명 — 앱이 무엇을 하는지 한 단락 */}
        <p className="text-balance text-[15px] leading-relaxed text-foreground/85 drop-shadow-sm max-w-lg whitespace-pre-line">
          {t("intro")}
        </p>

        {/* 1차 CTA — 무료 시작 (primary) + 유료 플랜 (배경 없는 outline) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mt-2 w-full sm:w-auto max-w-sm sm:max-w-none">
          <Button asChild size="lg" className="min-w-44 shadow-lg">
            <Link href={ROUTES.login}>
              {t("startFree")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-w-44 border-white/50 bg-transparent hover:bg-white/10"
          >
            <Link href={ROUTES.pricing}>{t("viewPricing")}</Link>
          </Button>
        </div>

        {/* 보조: 이미 계정 있으면 로그인 */}
        <p className="text-[15px] text-foreground/70 drop-shadow-sm">
          {t("alreadyMember")}{" "}
          <Link
            href={ROUTES.login}
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            {t("loginLink")}
          </Link>
        </p>

        {/* 스크롤 아래로 힌트 */}
        <div
          aria-hidden
          className="flex flex-col items-center gap-1 text-foreground/60 mt-6 sm:mt-10 animate-bounce"
        >
          <span className="text-[15px] tracking-widest">SCROLL</span>
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      <PreviewSection />
      <ValuePropsSection />
      <OraclesSection />
      <HowToPlaySection />
      <PlansSection />
      <FaqSection />

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-8 text-center">
        <Button asChild size="lg" className="min-w-48 shadow-lg">
          <Link href={ROUTES.login}>
            {t("finalCta")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </main>
  );
}

/** 차별점 3카드 섹션. */
async function ValuePropsSection() {
  const t = await getTranslations("landing.valueProps");
  const items = [
    {
      icon: Layers,
      title: t("v1Title"),
      body: t("v1Body"),
    },
    {
      icon: MessagesSquare,
      title: t("v2Title"),
      body: t("v2Body"),
    },
    {
      icon: Sparkles,
      title: t("v3Title"),
      body: t("v3Body"),
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-5xl space-y-6 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] text-muted-foreground">
          {t("subheading")}
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

/** 9명 주술사 캐릭터 쇼케이스. 3 카테고리 × 3명 = 3×3 grid. */
async function OraclesSection() {
  const t = await getTranslations("landing.oracles");
  const tChar = await getTranslations("characters");

  const categories: { key: "이세계" | "동양" | "북유럽"; label: string }[] = [
    { key: "이세계", label: "이세계" },
    { key: "동양", label: "동양" },
    { key: "북유럽", label: "북방" },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {t("subheading")}
        </p>
      </div>

      <div className="space-y-8">
        {categories.map(({ key, label }) => (
          <div key={key} className="space-y-3">
            <p className="font-mystic text-base font-semibold uppercase tracking-widest text-foreground/60 text-center sm:text-left">
              {label}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {CHARACTERS_BY_CATEGORY[key].map((id) => (
                <OracleCard
                  key={id}
                  id={id}
                  name={tChar(`${id}.name`)}
                  title={tChar(`${id}.title`)}
                  hook={tChar(`${id}.hook`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button asChild size="lg" className="shadow-lg">
          <Link href={ROUTES.login}>
            {t("cta")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function OracleCard({
  id,
  name,
  title,
  hook,
}: {
  id: CharacterId;
  name: string;
  title: string;
  hook: string;
}) {
  // 낮 이미지를 카드용으로 사용 (랜딩은 밝은 톤 강조).
  const imageSrc = CHARACTERS[id].imageSrcDay;

  return (
    <Card className="app-surface overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover object-top"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-0.5 text-white">
          <p className="font-mystic text-lg font-semibold drop-shadow">
            {name}
          </p>
          <p className="text-[15px] text-white/85 drop-shadow">{title}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="font-mystic text-[15px] leading-relaxed text-foreground/85 italic">
          “{hook}”
        </p>
      </CardContent>
    </Card>
  );
}

/** 사용법·꿀팁 3카드 섹션. */
async function HowToPlaySection() {
  const t = await getTranslations("landing.howToPlay");
  const items = [
    {
      icon: MessageCircle,
      title: t("tip1Title"),
      body: t("tip1Body"),
      tone: "bg-primary/15 text-primary",
    },
    {
      icon: Heart,
      title: t("tip2Title"),
      body: t("tip2Body"),
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: Lightbulb,
      title: t("tip3Title"),
      body: t("tip3Body"),
      // 꿀팁은 시각적으로 구분 — amber 톤 + ring 강조
      tone: "bg-amber-400/15 text-amber-500",
      highlight: true,
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-5xl space-y-6 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] text-muted-foreground">{t("subheading")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body, tone, highlight }) => (
          <Card
            key={title}
            className={
              highlight
                ? "h-full ring-1 ring-amber-400/40 bg-amber-400/5"
                : "h-full"
            }
          >
            <CardHeader className="space-y-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed whitespace-pre-line">
                {body}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** 가격 섹션 — 무료 / 라이트 / 프로 3 카드. 가격 페이지와 동일 데이터 소스. */
async function PlansSection() {
  const t = await getTranslations("landing.plansSection");
  const tPricing = await getTranslations("pricing");

  return (
    <section className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {t("subheading")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* 무료 */}
        <Card className="app-surface flex flex-col">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl">
              {tPricing("freeName")}
            </CardTitle>
            <CardDescription>{tPricing("freeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <p className="font-mystic text-3xl font-semibold">₩0</p>
            <ul className="space-y-2 text-[15px] flex-1">
              <PlanBullet>
                {tPricing("fortuneLine", { n: FREE_DAILY_LIMITS.fortune })}
              </PlanBullet>
              <PlanBullet>
                {tPricing("tarotOneLine", { n: FREE_DAILY_LIMITS.tarot })}
              </PlanBullet>
              <PlanBullet>
                {tPricing("chatLine", { n: FREE_DAILY_LIMITS.chat })}
              </PlanBullet>
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.login}>{tPricing("ctaFreeStart")}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* 라이트 — 인기 배지 */}
        <Card className="app-surface flex flex-col ring-2 ring-primary/40 relative overflow-hidden">
          <div className="absolute top-0 right-0">
            <div className="flex items-center gap-1 bg-primary text-primary-foreground text-[15px] font-bold px-3 py-1.5 rounded-bl-xl">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("badgePopular")}
            </div>
          </div>
          <CardHeader className="pt-8">
            <CardTitle className="font-mystic text-2xl">
              {SUBSCRIPTION.lite.label}
            </CardTitle>
            <CardDescription>{tPricing("lightDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <p className="font-mystic text-3xl font-semibold text-primary">
              {formatKRW(SUBSCRIPTION.lite.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                {tPricing("perMonth")}
              </span>
            </p>
            <ul className="space-y-2 text-[15px] flex-1">
              <PlanBullet>
                {tPricing("fortuneLine", { n: LITE_DAILY_LIMITS.fortune })}
              </PlanBullet>
              <PlanBullet>
                {tPricing("tarotLine", { n: LITE_DAILY_LIMITS.tarot })}
              </PlanBullet>
              <PlanBullet>
                {tPricing("chatLine", { n: LITE_DAILY_LIMITS.chat })}
              </PlanBullet>
              <PlanBullet>{tPricing("bulletZodiac")}</PlanBullet>
              <PlanBullet>{tPricing("bulletTarotThree")}</PlanBullet>
              <PlanBullet>{tPricing("bulletCompat")}</PlanBullet>
            </ul>
            <Button asChild className="w-full">
              <Link href={ROUTES.pricing}>{tPricing("ctaLightStart")}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* 프로 */}
        <Card className="app-surface flex flex-col">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" aria-hidden />
              {SUBSCRIPTION.pro.label}
            </CardTitle>
            <CardDescription>{tPricing("proDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <p className="font-mystic text-3xl font-semibold">
              {formatKRW(SUBSCRIPTION.pro.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                {tPricing("perMonth")}
              </span>
            </p>
            <ul className="space-y-2 text-[15px] flex-1">
              <PlanBullet>
                {tPricing("fortuneLine", { n: PRO_DAILY_LIMITS.fortune })}
              </PlanBullet>
              <PlanBullet>
                {tPricing("bulletTarotCeltic", { n: PRO_DAILY_LIMITS.tarot })}
              </PlanBullet>
              <PlanBullet>
                {tPricing("chatLine", { n: PRO_DAILY_LIMITS.chat })}
              </PlanBullet>
              <PlanBullet>{tPricing("bulletZodiac")}</PlanBullet>
              <PlanBullet>{tPricing("bulletLenormand")}</PlanBullet>
              <PlanBullet>{tPricing("bulletRunes")}</PlanBullet>
              <PlanBullet>{tPricing("bulletCompat")}</PlanBullet>
              <PlanBullet>{tPricing("bulletSajuDeep")}</PlanBullet>
              <PlanBullet>{tPricing("bulletGacha")}</PlanBullet>
            </ul>
            <Button asChild variant="secondary" className="w-full">
              <Link href={ROUTES.pricing}>{tPricing("ctaProStart")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PlanBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 leading-relaxed">
      <Check
        className="h-4 w-4 text-primary flex-shrink-0 mt-0.5"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

/** 결과물 미리보기 섹션 (예시 카드 2장). */
async function PreviewSection() {
  const t = await getTranslations("landing.preview");
  return (
    <section className="relative z-10 mx-auto max-w-3xl space-y-6 px-6 pt-12 sm:pt-16">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] text-muted-foreground">{t("exampleLabel")}</p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* 타로 미리보기 */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">타로 한 장</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[15px] text-muted-foreground">
                예시
              </span>
            </div>
            <CardDescription className="text-[15px]">The Star · 별의 인도</CardDescription>
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
            <p className="text-[15px] leading-relaxed text-muted-foreground">
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
              <span className="rounded-full bg-muted px-2 py-0.5 text-[15px] text-muted-foreground">
                예시
              </span>
            </div>
            <CardDescription className="text-[15px]">사주 + 일진 통합 풀이</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[15px] font-medium leading-relaxed">
              조급함을 내려놓을수록 길이 보이는 하루.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              계획대로 풀리지 않더라도 흔들리지 마세요. 오늘은 결단보다 관찰이
              유리합니다. 가까운 사람의 한마디에 단서가 있을 수 있어요.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["회복", "기다림", "별빛"].map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[15px] text-primary"
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
      a: "네. 가입만 하면 매일 운세 2회·타로 1장·주술사 문답 10회를 무료로 받으실 수 있어요. 더 많은 풀이를 원하시면 위 가격 안내에서 라이트·프로 멤버십을 확인해주세요.",
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
      a: "안전한 카드 결제로 매월 자동 갱신됩니다. 언제든지 설정 페이지에서 취소할 수 있어요.",
    },
    {
      q: "탈퇴/환불 정책은?",
      a: "설정 페이지에서 언제든 구독을 취소할 수 있고, 다음 결제일 전에 취소하시면 더 이상 청구되지 않아요. 환불은 첫 결제 후 7일 이내 고객문의 이메일로 요청해주세요. 자세한 내용은 환불정책 페이지를 참고해주세요.",
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
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold">
              <span>{q}</span>
              <span
                aria-hidden
                className="text-muted-foreground transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
