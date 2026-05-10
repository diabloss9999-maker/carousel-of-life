/**
 * 사이트 메타데이터 및 SEO 정보.
 */
import type { Metadata } from "next";

export const siteConfig = {
  name: "인생의 회전목마",
  shortName: "회전목마",
  englishName: "Carousel of Life",
  slug: "carousel-of-life",
  tagline: "별의 흐름과 카드의 계시로 오늘의 운명을 읽어드려요",
  description:
    "사주팔자·타로·성격유형을 통합한 AI 운명 풀이. 신비한 주술사가 매일의 기운을 읽어드립니다.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://carousel-of-life.vercel.app",
  ogImage: "/og-image.png",
  keywords: [
    "사주",
    "타로",
    "운세",
    "AI 운세",
    "사주팔자",
    "성격유형 궁합",
    "오늘의 운세",
    "주술사",
    "운명",
    "인생의 회전목마",
  ],
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
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  applicationName: siteConfig.name,
  generator: "Next.js",
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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};
