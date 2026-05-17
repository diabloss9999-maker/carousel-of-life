/**
 * 풀이 결과 공유 랜딩 페이지.
 *
 * 채팅에서 받은 Q&A 한 쌍을 받아서:
 * 1. og:image / twitter:image 메타로 OG 카드를 노출 → 카카오·X 미리보기에 큰 이미지로 떠진다.
 * 2. 페이지 자체엔 카드 미리보기 + "나도 풀이 받기" CTA 를 띄워 신규 유입을 받는다.
 *
 * URL 예: /share?c=child&q=이별이%20너무%20힘들어&a=...&locale=ko
 */

import type { Metadata } from "next";
import Link from "next/link";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { siteConfig } from "@/config/site";

interface ShareSearchParams {
  c?: string;
  q?: string;
  a?: string;
  locale?: string;
}

function pickCharacterId(raw: string | undefined): CharacterId {
  if (raw && Object.prototype.hasOwnProperty.call(CHARACTERS, raw)) {
    return raw as CharacterId;
  }
  return "witch";
}

function buildOgUrl(params: ShareSearchParams): string {
  const sp = new URLSearchParams();
  if (params.c) sp.set("c", params.c);
  if (params.q) sp.set("q", params.q);
  if (params.a) sp.set("a", params.a);
  if (params.locale) sp.set("locale", params.locale);
  return `/api/share/chat?${sp.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ShareSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const characterId = pickCharacterId(sp.c);
  const character = CHARACTERS[characterId];
  const locale = sp.locale === "en" ? "en" : "ko";

  const title =
    locale === "en"
      ? `${character.name} read this fortune for me — ${siteConfig.name}`
      : `${character.name}이(가) 풀어준 이야기 — ${siteConfig.name}`;
  const description =
    locale === "en"
      ? "An AI oracle reading from Carousel of Life. Ask yours."
      : "인생의 회전목마에서 받은 주술사의 풀이. 너도 한 번 물어봐.";

  const ogUrl = buildOgUrl(sp);

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogUrl,
          width: 1080,
          height: 1080,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
    // 공유 결과 페이지는 색인하지 않는다 — 개인 풀이라 SEO 대상이 아니고,
    // 비슷한 URL 이 무한 생성되는 걸 막는다.
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<ShareSearchParams>;
}) {
  const sp = await searchParams;
  const characterId = pickCharacterId(sp.c);
  const character = CHARACTERS[characterId];
  const locale = sp.locale === "en" ? "en" : "ko";
  const ogUrl = buildOgUrl(sp);

  const ctaLabel = locale === "en" ? "Ask your own oracle" : "나도 풀이 받아보기";
  const subLabel =
    locale === "en"
      ? `${character.name} · ${character.title}`
      : `${character.name} · ${character.title}`;
  const hint =
    locale === "en"
      ? "A reading shared from Carousel of Life."
      : "인생의 회전목마에서 공유된 풀이.";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[640px] flex flex-col items-center gap-6">
        <p className="text-[15px] text-muted-foreground tracking-wide">{hint}</p>

        {/* OG 카드 미리보기 — 같은 이미지를 페이지 안에서도 보여준다 */}
        <div className="w-full aspect-square overflow-hidden rounded-3xl border border-border/40 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogUrl}
            alt={subLabel}
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-[15px] text-foreground/80 text-center">{subLabel}</p>

        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground text-[15px] font-medium tracking-wide hover:opacity-90 transition-opacity"
        >
          {ctaLabel}
        </Link>
      </div>
    </main>
  );
}
