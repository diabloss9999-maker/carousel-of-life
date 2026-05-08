import type { Metadata, Viewport } from "next";
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
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,oklch(1_0_0/0.08),transparent_35%,oklch(0.12_0.03_55/0.08))]"
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
