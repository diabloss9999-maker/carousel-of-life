/**
 * 사업자 정보 — 통신판매업 + 토스페이먼츠 가맹점 심사 위한 법적 표시.
 *
 * 확정된 값은 코드에 직접 박고, 아직 발급/확정 전인 값은 환경변수로 받되
 * 비어 있으면 자리표시자 텍스트가 표시된다.
 * Vercel 환경변수(NEXT_PUBLIC_*) 가 있으면 그게 우선이라 향후 갱신은
 * Vercel 만 손대도 된다.
 */
export const BUSINESS_INFO = {
  serviceName: "인생의 회전목마",
  companyName: "레오나르도코드",
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || "최영탁",
  businessNumber: "859-35-01908",
  ecommerceNumber:
    process.env.NEXT_PUBLIC_ECOMMERCE_NUMBER || "제 2026-서울노원-0765 호",
  address:
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "[사업장 주소 준비 중]",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "diabloss9999@gmail.com",
  hosting: "Vercel Inc.",
} as const;

export type BusinessInfo = typeof BUSINESS_INFO;
