import type { Metadata } from "next";

import { LegalProse } from "@/components/legal/legal-prose";
import { BUSINESS_INFO } from "@/lib/constants/business-info";

const LAST_MODIFIED = "2026년 5월 15일";

export const metadata: Metadata = {
  title: "환불정책 · 인생의 회전목마",
  description: "인생의 회전목마 결제 환불 정책 안내.",
};

export default function RefundPage() {
  return (
    <LegalProse title="환불정책" lastModified={LAST_MODIFIED}>
      <section>
        <p>
          {BUSINESS_INFO.companyName}(이하 &quot;회사&quot;)는 전자상거래 등에서의
          소비자보호에 관한 법률(이하 &quot;전자상거래법&quot;)에 따라 다음과 같이
          환불 정책을 운영합니다.
        </p>
      </section>

      <section>
        <h2>1. 청약철회 기간</h2>
        <p>
          이용자는 결제일로부터 <strong>7일 이내</strong>에 청약철회를 요청할 수
          있습니다. (전자상거래법 제17조 제1항)
        </p>
      </section>

      <section>
        <h2>2. 청약철회 제한</h2>
        <p>
          다음의 경우 전자상거래법 제17조 제2항 5호에 따라 청약철회가 제한될 수
          있습니다.
        </p>
        <ul>
          <li>
            이미 디지털 콘텐츠가 제공된 경우 — 사주 심층 풀이·운세 결과·타로
            결과 등 유료 풀이를 한 번이라도 사용한 경우
          </li>
          <li>
            구독 기간 중 라이트·프로 멤버십의 일일 한도를 일부라도 소비한 경우
          </li>
          <li>이용자의 사용으로 재화 등의 가치가 현저히 감소한 경우</li>
        </ul>
        <p>
          단, 회사는 이용자 보호를 위해 결제 후 <strong>유료 풀이를 사용하지
          않은 경우</strong>에 한하여 7일 이내 100% 환불을 보장합니다.
        </p>
      </section>

      <section>
        <h2>3. 환불 신청 방법</h2>
        <p>
          환불을 요청하시는 경우 다음 정보를 포함하여{" "}
          <strong>{BUSINESS_INFO.email}</strong>로 이메일을 보내주세요.
        </p>
        <ul>
          <li>가입 이메일 주소</li>
          <li>결제 일자</li>
          <li>환불 요청 사유</li>
        </ul>
      </section>

      <section>
        <h2>4. 환불 처리 절차</h2>
        <ul>
          <li>접수 후 영업일 기준 1~2일 이내 회신을 드립니다.</li>
          <li>환불이 승인되면 결제 수단(카드 등) 으로 영업일 기준 3~5일 이내 환급됩니다.</li>
          <li>
            결제 대행사·카드사의 정산 일정에 따라 실제 환급 시점이 영업일 기준
            최대 10일까지 소요될 수 있습니다.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. 구독 취소 (정기 결제 중단)</h2>
        <p>
          이용자는 설정 페이지에서 언제든 구독을 취소할 수 있습니다. 다음 결제일
          전에 취소하시면 추가 청구는 발생하지 않으며, 이미 결제된 기간 동안에는
          유료 서비스를 그대로 이용하실 수 있습니다. 정기 결제 중단은
          &quot;환불&quot; 과 다른 개념이며, 환불을 원하시는 경우 위 환불 신청
          절차를 따로 진행해주세요.
        </p>
      </section>

      <section>
        <h2>6. 결제 오류로 인한 환불</h2>
        <p>
          시스템 오류, 중복 결제, 회사의 귀책사유로 인한 결제 오류가 확인된
          경우에는 위 청약철회 제한과 무관하게 전액 환불됩니다.
        </p>
      </section>

      <section>
        <h2>7. 단건 결제 상품의 환불</h2>
        <p>
          정통 사주 풀이(PDF), 작명 추천, 신년 운세 풀패키지 등 단건 결제 상품의
          경우, 콘텐츠가 발송·열람되기 전까지는 7일 이내 환불 가능하며, 이미
          발송·열람된 경우에는 환불이 제한될 수 있습니다.
        </p>
      </section>

      <section>
        <h2>8. 분쟁 해결</h2>
        <p>
          환불 관련 분쟁이 원만히 해결되지 않을 경우, 콘텐츠분쟁조정위원회 또는
          서울중앙지방법원 등 관할 분쟁조정기관·법원의 조정·판결에 따릅니다.
        </p>
      </section>

      <section>
        <h2>부칙</h2>
        <p>본 환불정책은 {LAST_MODIFIED}부터 적용됩니다.</p>
      </section>
    </LegalProse>
  );
}
