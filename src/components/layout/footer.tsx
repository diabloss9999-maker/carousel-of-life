/**
 * 사이트 푸터.
 *
 * 통신판매업 사업자 정보 + 법적 페이지 링크를 모든 페이지 하단에 노출한다.
 * lore 톤은 유지하되 사업자 정보 영역은 명확하게 읽히도록 정돈.
 */
import Link from "next/link";
import type { Route } from "next";

import { BUSINESS_INFO } from "@/lib/constants/business-info";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative z-10 mt-10 border-t border-black/5 bg-white/35 backdrop-blur-md"
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:gap-6">
          {/* 1) 사업자 정보 — 맨 왼쪽. NHN KCP 가맹점 심사 필수 6항목 모두 노출.
                  순서: 상호 → 대표 → 사업자등록번호 → 통신판매신고번호
                       → 사업장 주소 → 전화번호 */}
          <dl className="space-y-1 text-[12px] leading-snug text-foreground/62 sm:text-[13px]">
            <BusinessRow label="상호" value={BUSINESS_INFO.companyName} />
            <BusinessRow label="대표" value={BUSINESS_INFO.ownerName} />
            <BusinessRow
              label="사업자등록번호"
              value={BUSINESS_INFO.businessNumber}
            />
            <BusinessRow
              label="통신판매업신고번호"
              value={BUSINESS_INFO.ecommerceNumber}
            />
            <BusinessRow label="사업장 주소" value={BUSINESS_INFO.address} />
            <BusinessRow label="전화번호" value={BUSINESS_INFO.phone} />
            <BusinessRow label="이메일" value={BUSINESS_INFO.email} />
            <BusinessRow label="호스팅" value={BUSINESS_INFO.hosting} />
          </dl>

          {/* 2) 약관 링크 — 오른쪽 */}
          <nav
            aria-label="법적 안내"
            className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] font-medium text-foreground/65 sm:text-[13px] md:block md:space-y-1"
          >
            <FooterLink href="/terms">이용약관</FooterLink>
            <FooterLink href="/privacy">개인정보처리방침</FooterLink>
            <FooterLink href="/refund">환불정책</FooterLink>
            <FooterLink href="/business">사업자정보</FooterLink>
          </nav>
        </div>

        <p className="border-t border-black/5 pt-3 text-center text-[12px] text-foreground/45">
          © {year} {BUSINESS_INFO.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function BusinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[4.2rem] shrink-0 font-medium text-foreground/45">
        {label}
      </dt>
      <dd className="break-keep">{value}</dd>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  // 약관 페이지들은 Task 4 에서 typed routes 에 등록되므로
  // 일관성 + 타입 안정성 위해 Route 로 캐스트.
  return (
    <Link
      href={href as Route}
      className="block underline-offset-4 transition hover:text-primary hover:underline"
    >
      {children}
    </Link>
  );
}
