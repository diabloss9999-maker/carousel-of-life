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
  dateRange: string;       // 예: "3월 21일 ~ 4월 19일"
  start: [number, number];
  end: [number, number];
  compatible: string[];    // 잘 맞는 별자리 한글 이름
  incompatible: string[];  // 안 맞는 별자리 한글 이름
}

export const ZODIAC_LIST: ZodiacInfo[] = [
  { id: "aries",       ko: "양자리",    en: "Aries",       dateRange: "3월 21일 ~ 4월 19일",   start: [3,21],  end: [4,19],  compatible: ["사자자리","사수자리"],     incompatible: ["게자리","천칭자리"]    },
  { id: "taurus",      ko: "황소자리",  en: "Taurus",      dateRange: "4월 20일 ~ 5월 20일",   start: [4,20],  end: [5,20],  compatible: ["처녀자리","염소자리"],     incompatible: ["사자자리","물병자리"]  },
  { id: "gemini",      ko: "쌍둥이자리",en: "Gemini",      dateRange: "5월 21일 ~ 6월 21일",   start: [5,21],  end: [6,21],  compatible: ["천칭자리","물병자리"],     incompatible: ["처녀자리","물고기자리"] },
  { id: "cancer",      ko: "게자리",    en: "Cancer",      dateRange: "6월 22일 ~ 7월 22일",   start: [6,22],  end: [7,22],  compatible: ["전갈자리","물고기자리"],   incompatible: ["양자리","천칭자리"]    },
  { id: "leo",         ko: "사자자리",  en: "Leo",         dateRange: "7월 23일 ~ 8월 22일",   start: [7,23],  end: [8,22],  compatible: ["양자리","사수자리"],       incompatible: ["황소자리","전갈자리"]  },
  { id: "virgo",       ko: "처녀자리",  en: "Virgo",       dateRange: "8월 23일 ~ 9월 22일",   start: [8,23],  end: [9,22],  compatible: ["황소자리","염소자리"],     incompatible: ["쌍둥이자리","사수자리"] },
  { id: "libra",       ko: "천칭자리",  en: "Libra",       dateRange: "9월 23일 ~ 10월 22일",  start: [9,23],  end: [10,22], compatible: ["쌍둥이자리","물병자리"],   incompatible: ["게자리","양자리"]      },
  { id: "scorpio",     ko: "전갈자리",  en: "Scorpio",     dateRange: "10월 23일 ~ 11월 21일", start: [10,23], end: [11,21], compatible: ["게자리","물고기자리"],     incompatible: ["사자자리","황소자리"]  },
  { id: "sagittarius", ko: "사수자리",  en: "Sagittarius", dateRange: "11월 22일 ~ 12월 21일", start: [11,22], end: [12,21], compatible: ["양자리","사자자리"],       incompatible: ["처녀자리","쌍둥이자리"] },
  { id: "capricorn",   ko: "염소자리",  en: "Capricorn",   dateRange: "12월 22일 ~ 1월 19일",  start: [12,22], end: [1,19],  compatible: ["황소자리","처녀자리"],     incompatible: ["양자리","사자자리"]    },
  { id: "aquarius",    ko: "물병자리",  en: "Aquarius",    dateRange: "1월 20일 ~ 2월 18일",   start: [1,20],  end: [2,18],  compatible: ["쌍둥이자리","천칭자리"],   incompatible: ["황소자리","전갈자리"]  },
  { id: "pisces",      ko: "물고기자리",en: "Pisces",      dateRange: "2월 19일 ~ 3월 20일",   start: [2,19],  end: [3,20],  compatible: ["게자리","전갈자리"],       incompatible: ["쌍둥이자리","사수자리"] },
];

/** 생년월일(YYYY-MM-DD)로 별자리 계산. */
export function getZodiacSign(birthDate: string): ZodiacInfo {
  const [, mm, dd] = birthDate.split("-").map(Number);
  for (const z of ZODIAC_LIST) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm <= em) {
      if ((mm === sm && dd >= sd) || (mm === em && dd <= ed) || (mm > sm && mm < em)) return z;
    } else {
      if ((mm === sm && dd >= sd) || mm > sm || (mm === em && dd <= ed) || mm < em) return z;
    }
  }
  return ZODIAC_LIST[11];
}

// =============================================================================
// 12간지
// =============================================================================

export type ChineseZodiacSign =
  | "rat" | "ox" | "tiger" | "rabbit" | "dragon" | "snake"
  | "horse" | "goat" | "monkey" | "rooster" | "dog" | "pig";

export interface ChineseZodiacInfo {
  id: ChineseZodiacSign;
  ko: string;           // "쥐띠"
  animal: string;       // "쥐"
  yearExample: string;  // "2020, 2008, 1996..."
  compatible: string[]; // 잘 맞는 띠 이름 ("소띠" 등)
  incompatible: string[];
}

export const CHINESE_ZODIAC_LIST: ChineseZodiacInfo[] = [
  { id: "rat",     ko: "쥐띠",    animal: "쥐",    yearExample: "1948, 1960, 1972, 1984, 1996, 2008, 2020",   compatible: ["용띠","원숭이띠"],   incompatible: ["말띠","양띠"]      },
  { id: "ox",      ko: "소띠",    animal: "소",    yearExample: "1949, 1961, 1973, 1985, 1997, 2009, 2021",   compatible: ["뱀띠","닭띠"],       incompatible: ["양띠","말띠"]      },
  { id: "tiger",   ko: "호랑이띠",animal: "호랑이",yearExample: "1950, 1962, 1974, 1986, 1998, 2010, 2022",   compatible: ["말띠","개띠"],       incompatible: ["원숭이띠","뱀띠"]  },
  { id: "rabbit",  ko: "토끼띠",  animal: "토끼",  yearExample: "1951, 1963, 1975, 1987, 1999, 2011, 2023",   compatible: ["양띠","돼지띠"],     incompatible: ["닭띠","용띠"]      },
  { id: "dragon",  ko: "용띠",    animal: "용",    yearExample: "1952, 1964, 1976, 1988, 2000, 2012, 2024",   compatible: ["쥐띠","원숭이띠"],   incompatible: ["개띠","토끼띠"]    },
  { id: "snake",   ko: "뱀띠",    animal: "뱀",    yearExample: "1953, 1965, 1977, 1989, 2001, 2013, 2025",   compatible: ["소띠","닭띠"],       incompatible: ["돼지띠","호랑이띠"] },
  { id: "horse",   ko: "말띠",    animal: "말",    yearExample: "1954, 1966, 1978, 1990, 2002, 2014, 2026",   compatible: ["호랑이띠","개띠"],   incompatible: ["쥐띠","소띠"]      },
  { id: "goat",    ko: "양띠",    animal: "양",    yearExample: "1955, 1967, 1979, 1991, 2003, 2015, 2027",   compatible: ["토끼띠","돼지띠"],   incompatible: ["소띠","쥐띠"]      },
  { id: "monkey",  ko: "원숭이띠",animal: "원숭이",yearExample: "1956, 1968, 1980, 1992, 2004, 2016, 2028",   compatible: ["쥐띠","용띠"],       incompatible: ["호랑이띠","돼지띠"] },
  { id: "rooster", ko: "닭띠",    animal: "닭",    yearExample: "1957, 1969, 1981, 1993, 2005, 2017, 2029",   compatible: ["소띠","뱀띠"],       incompatible: ["토끼띠","개띠"]    },
  { id: "dog",     ko: "개띠",    animal: "개",    yearExample: "1958, 1970, 1982, 1994, 2006, 2018, 2030",   compatible: ["호랑이띠","말띠"],   incompatible: ["용띠","닭띠"]      },
  { id: "pig",     ko: "돼지띠",  animal: "돼지",  yearExample: "1959, 1971, 1983, 1995, 2007, 2019, 2031",   compatible: ["토끼띠","양띠"],     incompatible: ["뱀띠","원숭이띠"]  },
];

/** 태어난 연도로 12간지 계산. */
export function getChineseZodiac(birthDate: string): ChineseZodiacInfo {
  const year = Number(birthDate.split("-")[0]);
  const idx = (year - 1900) % 12;
  return CHINESE_ZODIAC_LIST[(idx + 12) % 12];
}
