/**
 * 사업자 정보 — 통신판매업 + 토스페이먼츠 가맹점 심사 위한 법적 표시.
 *
 * 일부 항목은 발급/확정 후에야 값이 채워지므로 환경변수로 받고,
 * 빈 값이면 자리표시자 텍스트가 표시된다. 그러면 운영 시 자리표시자가
 * 보여서 채워야 한다는 시각적 신호가 된다.
 *
 * Vercel 환경변수 (NEXT_PUBLIC_*) 에 채워 넣으면 자동 반영.
 */
export const BUSINESS_INFO = {
  serviceName: "인생의 회전목마",
  companyName: "레오나르도코드",
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || "[대표자명]",
  businessNumber: "859-35-01908",
  ecommerceNumber:
    process.env.NEXT_PUBLIC_ECOMMERCE_NUMBER || "[통신판매업 신고번호 준비 중]",
  address:
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "[사업장 주소 준비 중]",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "[고객문의 이메일]",
  hosting: "Vercel Inc.",
} as const;

export type BusinessInfo = typeof BUSINESS_INFO;
