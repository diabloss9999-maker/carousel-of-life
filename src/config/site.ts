/**
 * 사이트 메타데이터 및 SEO 정보.
 */
import type { Metadata } from "next";

export const siteConfig = {
  name: "인생의 회전목마",
  shortName: "회전목마",
  englishName: "Carousel of Life",
  slug: "carousel-of-life",
  tagline: "사주·타로 운세와 Carousel Nine 콘텐츠",
  description:
    "오늘의 운세, 타로, 사주, 궁합을 살펴보고 Carousel Nine 멤버 콘텐츠는 별도로 즐기는 한국어 라이프스타일 앱.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://carouseloflife.com",
  ogImage: "/og-carousel-meadow.png",
  author: {
    name: "인생의 회전목마",
    email: "support@carouselof.life",
  },
  links: {
    contact: "mailto:support@carouselof.life",
  },
} as const;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  applicationName: siteConfig.name,
  generator: "Next.js",
  // 표준 canonical URL — 미러 도메인(*-k5hs.vercel.app 등) 분산 방지
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
    statusBarStyle: "black-translucent",
  },
  // 아이콘은 src/app/icon.png · apple-icon.png · favicon.ico 파일 컨벤션으로
  // Next.js Metadata API 가 자동 등록한다. 별도 명시 불필요.
};
