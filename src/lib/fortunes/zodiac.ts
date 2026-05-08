/**
 * 별자리 · 12간지 계산 유틸리티.
 */

export type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export interface ZodiacInfo {
  id: ZodiacSign;
  ko: string;
  en: string;
  emoji: string;
  /** 시작 월일 (월, 일) */
  start: [number, number];
  /** 종료 월일 */
  end: [number, number];
}

export const ZODIAC_LIST: ZodiacInfo[] = [
  { id: "aries",       ko: "양자리",    en: "Aries",       emoji: "♈", start: [3, 21], end: [4, 19] },
  { id: "taurus",      ko: "황소자리",  en: "Taurus",      emoji: "♉", start: [4, 20], end: [5, 20] },
  { id: "gemini",      ko: "쌍둥이자리",en: "Gemini",      emoji: "♊", start: [5, 21], end: [6, 21] },
  { id: "cancer",      ko: "게자리",    en: "Cancer",      emoji: "♋", start: [6, 22], end: [7, 22] },
  { id: "leo",         ko: "사자자리",  en: "Leo",         emoji: "♌", start: [7, 23], end: [8, 22] },
  { id: "virgo",       ko: "처녀자리",  en: "Virgo",       emoji: "♍", start: [8, 23], end: [9, 22] },
  { id: "libra",       ko: "천칭자리",  en: "Libra",       emoji: "♎", start: [9, 23], end: [10, 22] },
  { id: "scorpio",     ko: "전갈자리",  en: "Scorpio",     emoji: "♏", start: [10, 23], end: [11, 21] },
  { id: "sagittarius", ko: "사수자리",  en: "Sagittarius", emoji: "♐", start: [11, 22], end: [12, 21] },
  { id: "capricorn",   ko: "염소자리",  en: "Capricorn",   emoji: "♑", start: [12, 22], end: [1, 19] },
  { id: "aquarius",    ko: "물병자리",  en: "Aquarius",    emoji: "♒", start: [1, 20], end: [2, 18] },
  { id: "pisces",      ko: "물고기자리",en: "Pisces",      emoji: "♓", start: [2, 19], end: [3, 20] },
];

/** 생년월일(YYYY-MM-DD)로 별자리 계산. */
export function getZodiacSign(birthDate: string): ZodiacInfo {
  const [, mm, dd] = birthDate.split("-").map(Number);

  for (const z of ZODIAC_LIST) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;

    if (sm <= em) {
      // 같은 해 내 범위 (예: 양자리 3/21~4/19)
      if ((mm === sm && dd >= sd) || (mm === em && dd <= ed) || (mm > sm && mm < em)) {
        return z;
      }
    } else {
      // 연말~연초 걸치는 범위 (예: 염소자리 12/22~1/19)
      if ((mm === sm && dd >= sd) || mm > sm || (mm === em && dd <= ed) || mm < em) {
        return z;
      }
    }
  }
  return ZODIAC_LIST[11]; // fallback: 물고기자리
}

// =============================================================================
// 12간지
// =============================================================================

export type ChineseZodiacSign =
  | "rat" | "ox" | "tiger" | "rabbit" | "dragon" | "snake"
  | "horse" | "goat" | "monkey" | "rooster" | "dog" | "pig";

export interface ChineseZodiacInfo {
  id: ChineseZodiacSign;
  ko: string;
  emoji: string;
}

export const CHINESE_ZODIAC_LIST: ChineseZodiacInfo[] = [
  { id: "rat",     ko: "쥐띠",  emoji: "🐭" },
  { id: "ox",      ko: "소띠",  emoji: "🐮" },
  { id: "tiger",   ko: "호랑이띠", emoji: "🐯" },
  { id: "rabbit",  ko: "토끼띠", emoji: "🐰" },
  { id: "dragon",  ko: "용띠",  emoji: "🐲" },
  { id: "snake",   ko: "뱀띠",  emoji: "🐍" },
  { id: "horse",   ko: "말띠",  emoji: "🐴" },
  { id: "goat",    ko: "양띠",  emoji: "🐑" },
  { id: "monkey",  ko: "원숭이띠", emoji: "🐵" },
  { id: "rooster", ko: "닭띠",  emoji: "🐔" },
  { id: "dog",     ko: "개띠",  emoji: "🐶" },
  { id: "pig",     ko: "돼지띠", emoji: "🐷" },
];

/** 태어난 연도로 12간지 계산. 기준: 1900년 = 쥐띠. */
export function getChineseZodiac(birthDate: string): ChineseZodiacInfo {
  const year = Number(birthDate.split("-")[0]);
  const idx = (year - 1900) % 12;
  return CHINESE_ZODIAC_LIST[(idx + 12) % 12];
}
