/**
 * 법적 문서 공통 prose 스타일 wrapper.
 *
 * 인쇄 친화적 (print 미디어 쿼리), 가독성 ↑, 헤더·리스트 정돈.
 */
import { BUSINESS_INFO } from "@/lib/constants/business-info";

interface LegalProseProps {
  title: string;
  /** 마지막 수정일 — ISO 또는 "2026년 5월 15일" 형식. */
  lastModified: string;
  children: React.ReactNode;
}

export function LegalProse({ title, lastModified, children }: LegalProseProps) {
  return (
    <article className="space-y-8">
      <header className="space-y-2 border-b border-white/20 pb-6">
        <p className="text-[15px] uppercase tracking-widest text-foreground/60 font-medium">
          {BUSINESS_INFO.serviceName}
        </p>
        <h1 className="font-mystic text-3xl sm:text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-[15px] text-foreground/60">
          최종 수정: {lastModified}
        </p>
      </header>

      <div className="space-y-8 leading-relaxed text-foreground/85 [&_h2]:font-mystic [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground [&_p]:text-[15px] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-[15px] [&_strong]:text-foreground [&_strong]:font-semibold print:[&_h2]:text-black print:[&_p]:text-black">
        {children}
      </div>
    </article>
  );
}
