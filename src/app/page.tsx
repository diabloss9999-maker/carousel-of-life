import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
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
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

type MemberFact = {
  label: string;
  value: string;
};

export const metadata: Metadata = {
  // 랜딩은 사이트 기본 타이틀 그대로 노출 (template 우회).
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description:
    "2026 신년운세, 사주팔자, 타로, 궁합으로 오늘과 한 해의 흐름을 살피고 Carousel Nine 콘텐츠는 별도로 즐겨요.",
  alternates: {
    canonical: "/",
  },
};

/**
 * 검색엔진용 JSON-LD 구조화 데이터.
 * WebSite + Organization 두 타입을 한 번에 노출.
 */
/** 랜딩의 FAQ 데이터 — JSON-LD 와 UI 두 군데서 공유한다. */
const LANDING_FAQS: { q: string; a: string }[] = [
  {
    q: "정말 무료인가요?",
    a: "네. 매일 운세 3회와 대화 10회를 무료로 드려요.",
  },
  {
    q: "사주 정보는 어떻게 입력하나요?",
    a: "온보딩에서 생년월일과 태어난 시각을 한 번만 입력하면 돼요.",
  },
  {
    q: "운세 풀이는 얼마나 정확한가요?",
    a: "사주·타로·성격유형을 함께 참고해요. 결정은 직접 해주세요.",
  },
];

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
        description: "무료 가입 후 오늘운세·사주·타로·궁합·2026 신년운세 일부 제공",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: LANDING_FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default async function HomePage() {
  const t = await getTranslations("landing");
  return (
    <main className="relative min-h-dvh overflow-hidden">
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

      <section className="landing-hero relative z-10 mx-auto flex min-h-[78dvh] max-w-6xl flex-col items-center justify-center overflow-hidden px-5 pb-10 pt-14 text-center sm:min-h-[74dvh] sm:px-6 sm:pb-12 sm:pt-16">
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-4 sm:gap-5">
          <p className="rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.28em] text-foreground/68 shadow-[0_4px_16px_rgba(35,39,48,0.045)] backdrop-blur-md">
            CAROUSEL NINE
          </p>

          <h1 className="font-mystic text-balance text-[46px] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-7xl">
            {siteConfig.name}
          </h1>

          <p className="font-mystic text-balance text-lg leading-relaxed text-foreground/90 sm:text-xl">
            {t("tagline")}
          </p>

          {/* 페이지 설명 — 앱이 무엇을 하는지 한 단락 */}
          <p className="max-w-xl whitespace-pre-line text-balance text-[15px] leading-relaxed text-foreground/68">
            {t("intro")}
          </p>

          {/* 1차 CTA: 멤버 경험 진입 */}
          <div className="mt-1 flex w-full max-w-sm flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full border border-black/90 bg-[#111318] px-7 text-white shadow-[0_14px_30px_rgba(18,20,24,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[#20232a]"
            >
              <Link href={ROUTES.login}>
                {t("startFree")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {["오늘운세", "사주", "타로", "궁합"].map((label) => (
                <span
                  key={label}
                className="rounded-full border border-black/8 bg-white/68 px-3 py-1 text-[12px] font-semibold text-foreground/60 backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* 스크롤 아래로 힌트 */}
          <div
            aria-hidden
            className="mt-2 flex flex-col items-center gap-1 text-foreground/45"
          >
            <span className="text-[11px] tracking-[0.22em]">SCROLL</span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      <PreviewSection />
      <ValuePropsSection />
      <OraclesSection />
      <HowToPlaySection />
      <FaqSection />
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
    <section className="relative z-10 mx-auto max-w-5xl space-y-6 px-5 pt-10 sm:px-6 sm:pt-14">
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
          <Card key={title} className="h-full border-black/10 bg-white/70">
            <CardHeader className="space-y-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/[0.09] text-primary ring-1 ring-primary/10">
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

/** 9명 AI 멤버 쇼케이스. 3 유닛 × 3명 = 3×3 grid. */
async function OraclesSection() {
  const t = await getTranslations("landing.oracles");
  const tChar = await getTranslations("characters");

  const categories: { key: "기본" | "확장" | "보관"; label: string }[] = [
    { key: "기본", label: "프론트 유닛" },
    { key: "확장", label: "스튜디오 유닛" },
    { key: "보관", label: "무드 유닛" },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-5xl space-y-8 px-5 pt-10 sm:px-6 sm:pt-14">
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
                  facts={tChar.raw(`${id}.facts`) as MemberFact[]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button
          asChild
          size="lg"
          className="h-auto min-h-12 max-w-full rounded-full border border-black/10 bg-white/82 px-7 py-3 text-center leading-tight text-foreground shadow-[0_10px_24px_rgba(23,26,32,0.08),inset_0_1px_0_rgba(255,255,255,0.70)] backdrop-blur-md transition hover:bg-white"
        >
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
  facts,
}: {
  id: CharacterId;
  name: string;
  title: string;
  hook: string;
  facts: MemberFact[];
}) {
  // 낮 이미지를 카드용으로 사용 (랜딩은 밝은 톤 강조).
  const imageSrc = CHARACTERS[id].imageSrcDay;

  return (
    <Card className="app-surface overflow-hidden rounded-[22px] transition duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(23,26,32,0.11)]">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-white/40">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover object-top transition duration-500 hover:scale-[1.025]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/12 to-transparent"
        />
        <div className="on-character-image absolute bottom-0 left-0 right-0 p-4 space-y-0.5">
          <p className="font-mystic text-lg font-semibold drop-shadow">
            {name}
          </p>
          <p className="text-[15px] drop-shadow opacity-90">{title}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="font-mystic text-[15px] leading-relaxed text-foreground/85 italic">
          “{hook}”
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-1.5 text-left text-[12px] leading-tight">
          {facts.map((fact) => (
            <div
              key={`${fact.label}-${fact.value}`}
              className="rounded-[10px] border border-black/8 bg-white/55 px-2 py-1.5"
            >
              <dt className="text-[12px] font-medium text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-semibold text-foreground/85">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
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
    <section className="relative z-10 mx-auto max-w-5xl space-y-6 px-5 pt-10 sm:px-6 sm:pt-14">
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

/** 결과물 미리보기 섹션 (예시 카드 2장). */
async function PreviewSection() {
  const t = await getTranslations("landing.preview");
  return (
    <section className="relative z-10 mx-auto max-w-3xl space-y-16 px-5 pt-10 sm:space-y-6 sm:px-6 sm:pt-10">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] text-muted-foreground">{t("exampleLabel")}</p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* 타로 미리보기 */}
        <Card className="overflow-hidden border-black/10 bg-white/72">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">타로 한 장</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[15px] text-muted-foreground">
                예시
              </span>
            </div>
            <CardDescription className="text-[15px]">
              The Star · 별의 인도
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mx-auto h-44 w-28 overflow-hidden rounded-[14px] shadow-[0_14px_32px_rgba(35,39,48,0.14)] ring-1 ring-black/10">
              <Image
                src="/tarot/the_star.webp"
                alt="타로 The Star 카드"
                width={224}
                height={352}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              오래 흐려 있던 마음에 다시 빛이 닿는 흐름이에요. 무리해서 결론 내기보다,
              지금은 회복할 시간을 확보하는 쪽이 유리해요. 작은 희망을 확인하는 것이
              오늘의 첫 선택입니다.
            </p>
            <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-[15px] leading-relaxed text-foreground/85">
              오늘의 행동: 확답을 기다리기보다 내가 회복할 수 있는 시간을 먼저 정하세요.
            </p>
          </CardContent>
        </Card>

        {/* 운세 미리보기 */}
        <Card className="border-black/10 bg-white/72">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">오늘 종합운</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[15px] text-muted-foreground">
                예시
              </span>
            </div>
            <CardDescription className="text-[15px]">
              오늘의 기운
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[15px] font-medium leading-relaxed">
              조급함을 내려놓을수록 오늘의 길이 또렷해지는 하루입니다.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              계획대로 풀리지 않더라도 크게 흔들릴 필요는 없어요. 오늘은 결단보다 관찰이
              유리하고, 가까운 사람의 한마디에 단서가 있을 수 있어요.
            </p>
            <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-[15px] leading-relaxed text-foreground/85">
              오늘의 행동: 급한 답장을 보내기 전, 한 번만 더 읽고 보내세요.
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

/** 자주 묻는 질문 섹션. FAQ 데이터는 JSON-LD 와 공유. */
function FaqSection() {
  const faqs = LANDING_FAQS;

  return (
    <section className="relative z-10 mx-auto max-w-2xl space-y-6 px-5 pt-10 sm:px-6 sm:pt-14">
      <div className="space-y-2 text-center">
        <h2 className="font-mystic text-2xl font-semibold sm:text-3xl">
          자주 묻는 질문
        </h2>
      </div>
      <div className="space-y-2">
        {faqs.map(({ q, a }) => (
          <details
            key={q}
            className="app-surface group rounded-[18px] p-4 [&_summary::-webkit-details-marker]:hidden"
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
