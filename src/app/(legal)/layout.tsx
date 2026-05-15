/**
 * 약관 · 정책 페이지 공통 레이아웃.
 *
 * left-aligned, max-w-3xl, prose 스타일.
 * 본문 톤: lore 톤 ❌ → 명확한 법적 한국어 ✅
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="relative z-10 mx-auto w-full max-w-3xl px-6 py-12 sm:py-16 print:py-8"
    >
      {children}
    </main>
  );
}
