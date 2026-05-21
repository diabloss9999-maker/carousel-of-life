import type { Metadata } from "next";

import { LegalProse } from "@/components/legal/legal-prose";
import { BUSINESS_INFO } from "@/lib/constants/business-info";

const LAST_MODIFIED = "2026년 5월 21일";

export const metadata: Metadata = {
  title: "개인정보처리방침 · 인생의 회전목마",
  description: "인생의 회전목마 개인정보처리방침.",
};

export default function PrivacyPage() {
  return (
    <LegalProse title="개인정보처리방침" lastModified={LAST_MODIFIED}>
      <section>
        <p>
          {BUSINESS_INFO.companyName}(이하 &quot;회사&quot;)는{" "}
          <strong>개인정보보호법</strong> 등 관련 법령상의 개인정보 보호 규정을
          준수하며, 본 개인정보처리방침을 통해 이용자의 개인정보가 어떠한 용도와
          방식으로 이용되고 있고 어떻게 보호받는지 안내합니다.
        </p>
      </section>

      <section>
        <h2>1. 수집하는 개인정보 항목</h2>
        <p>회사는 회원 가입 및 서비스 이용 과정에서 다음 항목을 수집합니다.</p>
        <h3>필수 항목</h3>
        <ul>
          <li>이메일 주소</li>
          <li>이름(닉네임)</li>
          <li>생년월일</li>
          <li>성별</li>
          <li>음력/양력 선택 정보</li>
        </ul>
        <h3>선택 항목</h3>
        <ul>
          <li>태어난 시각 (사주 풀이 정확도용)</li>
          <li>출생지</li>
          <li>성격유형 (16가지 중 하나)</li>
        </ul>
        <h3>카카오 로그인 시 추가 수집</h3>
        <ul>
          <li>카카오 계정 식별자(고유 ID)</li>
          <li>카카오 프로필 정보 (이메일, 닉네임 — 카카오 동의 항목에 따라)</li>
        </ul>
        <h3>자동 수집 항목</h3>
        <ul>
          <li>접속 IP, 쿠키, 서비스 이용 기록(접속 일시 등)</li>
          <li>점술사와의 채팅 내용 (서비스 품질 개선 및 친밀도 시스템 운영)</li>
        </ul>
        <h3>손금 풀이 시 일시 처리 항목 (영구 저장 X)</h3>
        <ul>
          <li>
            손바닥 사진 (이용자가 손금 풀이 기능 사용 시) — Anthropic Vision
            API 로 분석 호출 후 메모리에서 즉시 폐기되며, 회사 데이터베이스나
            저장소에 영구 보관하지 않습니다.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. 개인정보의 수집 및 이용 목적</h2>
        <ul>
          <li>회원 가입 및 회원관리 — 본인 확인, 부정 이용 방지</li>
          <li>
            서비스 제공 — 사주팔자 계산, AI 운세 풀이, 타로 해석, 점술사 채팅,
            성격유형 분석 및 궁합 풀이
          </li>
          <li>결제 및 환불 처리</li>
          <li>고객 문의 응대 및 공지사항 전달</li>
          <li>서비스 개선 및 통계 분석 (개인 식별이 불가능하도록 가공 후 사용)</li>
        </ul>
      </section>

      <section>
        <h2>3. 개인정보의 보유 및 이용 기간</h2>
        <p>
          회사는 회원 탈퇴 시 또는 수집 목적이 달성된 경우 지체 없이 개인정보를
          파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안
          보관합니다.
        </p>
        <ul>
          <li>전자상거래법: 계약·청약철회·결제·재화공급 기록 5년</li>
          <li>전자상거래법: 소비자 불만 또는 분쟁처리 기록 3년</li>
          <li>통신비밀보호법: 로그인 기록 3개월</li>
        </ul>
      </section>

      <section>
        <h2>4. 개인정보의 제3자 제공</h2>
        <p>
          회사는 이용자의 개인정보를 본 방침에서 고지한 범위 내에서 사용하며,
          이용자의 사전 동의 없이는 동 범위를 초과하여 이용하거나 원칙적으로
          외부에 공개하지 않습니다.
        </p>
      </section>

      <section>
        <h2>5. 개인정보 처리 위탁</h2>
        <p>
          회사는 원활한 서비스 제공을 위해 다음과 같이 일부 업무를 외부에 위탁
          처리하고 있습니다.
        </p>
        <ul>
          <li>
            <strong>Supabase Inc.</strong> — 사용자 인증, 데이터베이스 저장
          </li>
          <li>
            <strong>Vercel Inc.</strong> — 웹 서비스 호스팅
          </li>
          <li>
            <strong>Anthropic PBC</strong> — AI 풀이 생성. 회사는 이용자가 입력한
            텍스트만 API 호출 시 전송하며, 식별 정보(이름·이메일·계정 ID 등)는
            함께 전송하지 않습니다.
          </li>
          <li>
            <strong>Lemon Squeezy (Cromorich Studio Ltd.)</strong> — 결제 처리
            (추후 변경될 수 있음)
          </li>
          <li>
            <strong>Kakao Corp.</strong> — 카카오 OAuth 로그인 (이용자가 카카오
            로그인을 선택한 경우)
          </li>
        </ul>
        <p>
          처리 위탁 업체가 변경되거나 추가되는 경우 본 방침을 통해 사전에
          공지합니다.
        </p>
      </section>

      <section>
        <h2>6. 개인정보의 파기 절차 및 방법</h2>
        <p>
          회사는 수집 목적이 달성되거나 보유 기간이 경과한 개인정보를 지체 없이
          파기합니다. 전자적 파일 형태로 저장된 정보는 복원할 수 없는 기술적
          방법으로 영구 삭제하며, 출력물 형태의 정보는 분쇄하거나 소각합니다.
        </p>
      </section>

      <section>
        <h2>7. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람 요구</li>
          <li>오류가 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>
        <p>
          위 권리 행사는 회사 고객문의 이메일(
          <strong>{BUSINESS_INFO.email}</strong>)로 요청하시면 지체 없이
          조치하겠습니다.
        </p>
        <h3>앱 내 직접 삭제</h3>
        <p>
          이용자는 앱 내 <strong>설정 → 계정 관리 → 계정 삭제</strong> 메뉴에서
          본인 계정과 관련 모든 데이터를 직접 영구 삭제할 수 있습니다. 진행 중인
          유료 구독이 있다면 자동으로 취소됩니다.
        </p>
      </section>

      <section>
        <h2>8. 쿠키 및 자동 수집 도구</h2>
        <p>
          회사는 이용자에게 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다.
          이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 거부
          시 일부 서비스 이용에 제한이 있을 수 있습니다.
        </p>
      </section>

      <section>
        <h2>9. 개인정보 보호책임자</h2>
        <ul>
          <li>책임자: {BUSINESS_INFO.ownerName}</li>
          <li>전화: {BUSINESS_INFO.phone}</li>
          <li>이메일: {BUSINESS_INFO.email}</li>
        </ul>
        <p>
          개인정보 처리에 관한 문의·불만 처리·피해구제 등에 관한 사항은 위
          연락처로 문의해주시기 바랍니다.
        </p>
      </section>

      <section>
        <h2>10. 권익침해 구제 방법</h2>
        <ul>
          <li>개인정보분쟁조정위원회: 1833-6972 (privacy.go.kr)</li>
          <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
          <li>대검찰청 사이버수사과: 1301 (spo.go.kr)</li>
          <li>경찰청 사이버안전국: 182 (police.go.kr)</li>
        </ul>
      </section>

      <section>
        <h2>부칙</h2>
        <p>본 개인정보처리방침은 {LAST_MODIFIED}부터 적용됩니다.</p>
      </section>
    </LegalProse>
  );
}
