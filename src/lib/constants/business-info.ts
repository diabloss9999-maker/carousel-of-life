/**
 * 사업자 정보 — 통신판매업 + NHN KCP 가맹점 심사 위한 법적 표시.
 *
 * 확정된 값은 코드에 직접 박고, 아직 발급/확정 전인 값은 환경변수로 받되
 * 비어 있으면 자리표시자 텍스트가 표시된다.
 * Vercel 환경변수(NEXT_PUBLIC_*) 가 있으면 그게 우선이라 향후 갱신은
 * Vercel 만 손대도 된다.
 */
export const BUSINESS_INFO = {
  serviceName: "인생의 회전목마",
  companyName: "레오나르도코드",
  /** 해외 등록·D-U-N-S·Google Play Console 게시자명용 영문 표기. */
  companyNameEn: "Leonardo Code",
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || "최영탁",
  businessNumber: "859-35-01908",
  ecommerceNumber:
    process.env.NEXT_PUBLIC_ECOMMERCE_NUMBER || "제 2026-서울노원-0765 호",
  address:
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
    "서울특별시 노원구 동일로213길 21, 105동 803호 (01766)",
  /** 우편번호 단독 (해외 양식·운송장 등에 활용). */
  postalCode: "01766",
  /** 해외 등록·운송 등에 사용할 영문 주소. */
  addressEn:
    "#803, 105-Dong, 21 Dongil-ro 213-gil, Nowon-gu, Seoul 01766, Republic of Korea",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "diabloss9999@gmail.com",
  /**
   * 사업장 연락처 — 통신판매업·PG 가맹점 심사상 필수 표시 항목.
   * SKT 050 안심번호 부가서비스 (착신: 본인 휴대폰).
   */
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "050-6461-9495",
  hosting: "Vercel Inc.",
} as const;

export type BusinessInfo = typeof BUSINESS_INFO;
