import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { defaultMetadata } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0a14" },
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="h-full antialiased">
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
      <body className="relative min-h-full bg-background text-foreground">
        {/* 모바일 배경 (세로) — 전 페이지 공유, 스크롤 시 고정 */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-20 sm:hidden"
        >
          <Image
            src="/mystic-bg-mobile.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* 데스크톱 배경 (가로) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-20 hidden sm:block"
        >
          <Image
            src="/mystic-bg-wide.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* 가독성 보조 오버레이 — 콘텐츠가 많은 dashboard 등에서도 텍스트 잘 보이도록 */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-background/55 backdrop-blur-[1px]"
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
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
      </body>
    </html>
  );
}
