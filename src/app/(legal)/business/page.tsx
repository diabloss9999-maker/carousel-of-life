import type { Metadata } from "next";

import { LegalProse } from "@/components/legal/legal-prose";
import { BUSINESS_INFO } from "@/lib/constants/business-info";

const LAST_MODIFIED = "2026년 5월 21일";

export const metadata: Metadata = {
  title: "사업자정보",
  description: "통신판매업자 정보 공시.",
};

/** 사업자 정보 공시용 페이지 (전자상거래법 제13조). */
export default function BusinessPage() {
  const rows: { label: string; value: string }[] = [
    { label: "상호명", value: BUSINESS_INFO.companyName },
    { label: "서비스명", value: BUSINESS_INFO.serviceName },
    { label: "대표자", value: BUSINESS_INFO.ownerName },
    { label: "사업자등록번호", value: BUSINESS_INFO.businessNumber },
    { label: "통신판매업 신고번호", value: BUSINESS_INFO.ecommerceNumber },
    { label: "사업장 주소", value: BUSINESS_INFO.address },
    { label: "사업장 연락처", value: BUSINESS_INFO.phone },
    { label: "고객문의 이메일", value: BUSINESS_INFO.email },
    { label: "호스팅 서비스 제공자", value: BUSINESS_INFO.hosting },
  ];

  return (
    <LegalProse title="사업자정보" lastModified={LAST_MODIFIED}>
      <section>
        <p>
          전자상거래 등에서의 소비자보호에 관한 법률 제13조에 따라 다음과 같이
          사업자 정보를 공시합니다.
        </p>
      </section>

      <section>
        <dl className="rounded-2xl border border-white/20 overflow-hidden">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-[10rem_1fr] gap-4 px-5 py-3 ${
                i % 2 === 0 ? "bg-white/5" : ""
              }`}
            >
              <dt className="font-semibold text-foreground/70 text-[15px]">
                {r.label}
              </dt>
              <dd className="text-[15px] text-foreground/90 break-keep">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>사업자 정보 확인</h2>
        <p>
          공정거래위원회 통신판매사업자 정보 공개 서비스(
          <a
            href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=859-35-01908"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            사업자등록번호로 조회
          </a>
          )에서 본 사업자의 등록 정보를 확인하실 수 있습니다.
        </p>
      </section>

      <section>
        <h2>관련 페이지</h2>
        <ul>
          <li>이용약관 — /terms</li>
          <li>개인정보처리방침 — /privacy</li>
          <li>환불정책 — /refund</li>
        </ul>
      </section>
    </LegalProse>
  );
}
