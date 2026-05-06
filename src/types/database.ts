/**
 * DB 도메인 타입.
 *
 * Step 2 에서 Drizzle 스키마와 연동된 타입으로 확장한다.
 */

/** 성별. */
export type Gender = "male" | "female" | "other";

/** 음력/양력 구분. */
export type CalendarSystem = "solar" | "lunar";

/** 구독 상태. */
export type SubscriptionStatus =
  | "active"
  | "on_trial"
  | "paused"
  | "cancelled"
  | "expired";

/** 사주 8자 (천간·지지). */
export interface SajuPillars {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
}

/** 오행 분포. */
export interface FiveElements {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

/** 사용자 프로필 (Step 2 에서 DB 컬럼으로 매핑). */
export interface UserProfile {
  userId: string;
  displayName: string | null;
  birthDate: string; // ISO 날짜 (YYYY-MM-DD)
  birthTime: string | null; // HH:mm 또는 null (모름)
  calendarSystem: CalendarSystem;
  gender: Gender;
  mbti: string | null;
  birthPlace: string | null;
  sajuPillars: SajuPillars | null;
  fiveElements: FiveElements | null;
  createdAt: string;
  updatedAt: string;
}
