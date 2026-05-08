/**
 * 클라이언트·서버 모두에서 안전하게 사용 가능한 궁합 관련 상수.
 */

export const RELATIONSHIP_OPTIONS = [
  "연인",
  "배우자",
  "친구",
  "가족",
  "직장동료",
  "기타",
] as const;

export type RelationshipKind = (typeof RELATIONSHIP_OPTIONS)[number];
