import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { TimeAwareBg } from "@/components/layout/time-aware-bg";
import { AmbientTrack } from "@/components/effects/ambient-track";
import { GlobalMusicToggle } from "@/components/effects/global-music-toggle";
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
      </head>
      <body className="relative min-h-full text-foreground">
        {/* KST 시간대 배경 — 06~20시 낮, 21~05시 밤 */}
        <TimeAwareBg />
        {/* 가독성 오버레이 */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-white/10" />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            {/* 배경 BGM — 시간대에 따라 낮/밤 트랙 자동 교차 (UI 없음, 볼륨 0.18) */}
            <AmbientTrack />
            {/* 비대시보드 페이지용 떠있는 음소거 토글 (대시보드는 헤더 내 토글 사용) */}
            <GlobalMusicToggle />
            <Toaster
              position="top-center"
              theme="dark"
              richColors
              toastOptions={{
                style: {
                  fontFamily: "var(--font-sans), system-ui",
                },
              }}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
