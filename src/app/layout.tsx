import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/theme-provider";
import { TimeAwareBg } from "@/components/layout/time-aware-bg";
import { Footer } from "@/components/layout/footer";
import { AmbientTrack } from "@/components/effects/ambient-track";
import { GlobalMusicToggle } from "@/components/effects/global-music-toggle";
import { KakaoSdkScript } from "@/components/shared/kakao-sdk-script";
import { defaultMetadata } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0a14" },
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Pretendard — 한국어 친화 모던 산세리프 (CDN). */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        {/*
          Naver Search Advisor verification
          ----------------------------------
          https://searchadvisor.naver.com 에서 사이트 등록 후 발급받은
          <meta name="naver-site-verification" content="..."/> 태그를 여기에
          붙여 넣으세요. 그 전까지는 빈 자리로 남겨둡니다.
        */}
      </head>
      <body className="relative min-h-full text-foreground">
        {/* 키보드 사용자용 skip-to-main — 평소엔 안 보이고 Tab 포커스 시에만 노출. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-xl"
        >
          본문으로 건너뛰기
        </a>
        {/* KST 시간대 배경 — 06~20시 낮, 21~05시 밤 */}
        <TimeAwareBg />
        {/* 가독성 오버레이 */}
        <div aria-hidden className="ritual-readable-scrim" />

        {/* 카카오 Share SDK — 환경변수 있을 때만 로드 (트래픽 절약) */}
        <KakaoSdkScript />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Footer />
            {/* 배경 BGM — 시간대에 따라 낮/밤 트랙 자동 교차 (UI 없음, 볼륨 0.18) */}
            <AmbientTrack />
            {/* 비대시보드 페이지용 떠있는 음소거 토글 (대시보드는 헤더 내 토글 사용) */}
            <GlobalMusicToggle />
            <Toaster
              position="top-center"
              theme="dark"
              toastOptions={{
                // 사이트 전반 frosted glass 톤(.app-surface) 와 통일.
                style: {
                  fontFamily: "var(--font-sans), system-ui",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.22)",
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  color: "rgba(255,255,255,0.92)",
                },
              }}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
        {/* Vercel observability — 트래픽·Core Web Vitals 측정. Pro 플랜이면 활성화. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
