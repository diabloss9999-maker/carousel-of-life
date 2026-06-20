/**
 * 다국어 설정 — 클라이언트·서버 공용.
 *
 * 현재 지원 로케일: 한국어 (ko, 기본), 영어 (en), 일본어 (ja).
 * 사용자 선택은 쿠키 `NEXT_LOCALE` 에 저장 (next-intl 표준).
 */

export const LOCALES = ["ko", "en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

export const LOCALE_LABEL: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  ko: "KR",
  en: "EN",
  ja: "JP",
};

/** 쿠키 이름. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** 문자열이 유효한 로케일인지 판정. */
export function isLocale(v: string | undefined | null): v is Locale {
  return v != null && (LOCALES as readonly string[]).includes(v);
}
