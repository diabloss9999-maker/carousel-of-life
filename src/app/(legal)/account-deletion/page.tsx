import type { Metadata } from "next";

import { LegalProse } from "@/components/legal/legal-prose";
import { BUSINESS_INFO } from "@/lib/constants/business-info";

const LAST_MODIFIED = "2026년 6월 17일";

export const metadata: Metadata = {
  title: "계정 및 데이터 삭제",
  description:
    "인생의 회전목마 계정 및 개인정보 삭제 요청 방법 안내.",
};

/**
 * 계정·데이터 삭제 안내 페이지.
 *
 * Google Play 데이터 보안 양식의 "계정 삭제 URL" 요건 충족용 공개 페이지.
 * 요건: (1) 앱/개발자 이름 (2) 삭제 요청 단계 (3) 삭제·보관 데이터 유형과 보관 기간.
 */
export default function AccountDeletionPage() {
  return (
    <LegalProse title="계정 및 데이터 삭제" lastModified={LAST_MODIFIED}>
      <section>
        <p>
          <strong>인생의 회전목마</strong>(운영: {BUSINESS_INFO.companyName})는
          이용자가 본인의 계정과 관련 개인정보를 언제든지 직접 삭제할 수 있도록
          지원합니다. 본 페이지는 계정 삭제 절차와 삭제·보관되는 데이터 항목을
          안내합니다.
        </p>
      </section>

      <section>
        <h2>1. 앱 내에서 직접 삭제 (권장)</h2>
        <p>가장 빠른 방법입니다. 앱 또는 웹에서 아래 순서로 진행하세요.</p>
        <ul>
          <li>로그인 후 <strong>설정</strong> 화면으로 이동합니다.</li>
          <li><strong>계정 관리 → 계정 삭제</strong>를 선택합니다.</li>
          <li>안내에 따라 삭제를 확인하면 즉시 처리됩니다.</li>
        </ul>
        <p>
          웹에서 진행하실 경우:{" "}
          <strong>https://carouseloflife.com/settings</strong> 의 계정 삭제
          메뉴를 이용하세요.
        </p>
      </section>

      <section>
        <h2>2. 이메일로 삭제 요청</h2>
        <p>
          앱에 접근이 어려운 경우, 가입에 사용한 이메일 주소로 아래 주소에 삭제를
          요청하시면 본인 확인 후 지체 없이 처리합니다.
        </p>
        <ul>
          <li>요청 이메일: <strong>{BUSINESS_INFO.email}</strong></li>
          <li>제목 예시: &quot;계정 삭제 요청&quot;</li>
          <li>본문: 가입 이메일 주소 기재</li>
        </ul>
      </section>

      <section>
        <h2>3. 삭제되는 데이터</h2>
        <p>
          계정을 삭제하면 아래 데이터가 <strong>복구 불가능하게 영구 삭제</strong>
          됩니다.
        </p>
        <ul>
          <li>프로필 정보(이름, 생년월일, 태어난 시각, 성별, 출생지, 성격유형)</li>
          <li>사주 분석 결과 및 운세·타로·궁합 등 모든 풀이 기록</li>
          <li>멤버와의 대화 내용, 감정 기록, 출석·수집 카드 등 활동 데이터</li>
          <li>알림 구독 정보</li>
        </ul>
        <p>진행 중인 유료 구독이 있다면 계정 삭제 시 자동으로 취소됩니다.</p>
      </section>

      <section>
        <h2>4. 법령에 따라 일정 기간 보관되는 데이터</h2>
        <p>
          관련 법령상 보존 의무가 있는 일부 기록은 아래 기간 동안 분리 보관 후
          파기합니다. 이 데이터는 보관 기간 동안 다른 목적으로 이용되지 않습니다.
        </p>
        <ul>
          <li>계약·청약철회·결제·재화공급 기록: <strong>5년</strong> (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁처리 기록: <strong>3년</strong> (전자상거래법)</li>
          <li>로그인(접속) 기록: <strong>3개월</strong> (통신비밀보호법)</li>
        </ul>
      </section>

      <section>
        <h2>5. 문의</h2>
        <ul>
          <li>상호: {BUSINESS_INFO.companyName}</li>
          <li>대표: {BUSINESS_INFO.ownerName}</li>
          <li>이메일: {BUSINESS_INFO.email}</li>
          <li>전화: {BUSINESS_INFO.phone}</li>
        </ul>
        <p>
          개인정보 처리에 관한 자세한 내용은{" "}
          <strong>개인정보처리방침</strong>을 참고해 주세요.
        </p>
      </section>
    </LegalProse>
  );
}
