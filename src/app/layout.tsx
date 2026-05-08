import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { TimeAwareBg } from "@/components/layout/time-aware-bg";
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
      <body className="relative min-h-full text-foreground">
        {/* KST 시간대 배경 — 06~20시 낮, 21~05시 밤 */}
        <TimeAwareBg />
        {/* 가독성 오버레이 */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-white/10" />

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
