import "server-only";

/**
 * 일진(日辰) 계산 — 60갑자(甲子) 사이클 기반.
 *
 * 검증 기준점: 2025-01-01 (KST) = 丁亥일 (gzIndex = 23)
 *   - JDN(2025-01-01) = 2460677
 *   - (2460677 - 2460654) % 60 = 23 ⇒ 정(丁) 해(亥)
 *
 * 일주는 60일 주기로 반복된다.
 */

// 천간(天干) 10개
const STEMS_KO = [
  "갑",
  "을",
  "병",
  "정",
  "무",
  "기",
  "경",
  "신",
  "임",
  "계",
] as const;
const STEMS_HANJA = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
] as const;
const STEMS_ELEMENT = [
  "목",
  "목",
  "화",
  "화",
  "토",
  "토",
  "금",
  "금",
  "수",
  "수",
] as const;

// 지지(地支) 12개
const BRANCHES_KO = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
] as const;
const BRANCHES_HANJA = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;
const BRANCHES_ELEMENT = [
  "수",
  "토",
  "목",
  "목",
  "토",
  "화",
  "화",
  "토",
  "금",
  "금",
  "토",
  "수",
] as const;
const BRANCHES_ANIMAL = [
  "쥐",
  "소",
  "호랑이",
  "토끼",
  "용",
  "뱀",
  "말",
  "양",
  "원숭이",
  "닭",
  "개",
  "돼지",
] as const;

export interface GanjiInfo {
  /** 60갑자 인덱스 (0~59). */
  gzIndex: number;
  /** 천간 인덱스 (0~9). */
  stemIdx: number;
  /** 지지 인덱스 (0~11). */
  branchIdx: number;
  stemKo: string;
  stemHanja: string;
  branchKo: string;
  branchHanja: string;
  stemElement: string;
  branchElement: string;
  branchAnimal: string;
}

/**
 * 그레고리안 → 줄리안 일수(JDN) 변환.
 *
 * 검증된 표준 알고리즘.
 */
function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * 주어진 날짜(KST 기준)의 일주(日柱) 정보를 반환한다.
 *
 * @param date - 기준 날짜. 시간대는 KST로 정규화하여 사용.
 */
export function getDayPillar(date: Date): GanjiInfo {
  const kstString = date.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const kst = new Date(kstString);
  const jdn = toJDN(
    kst.getFullYear(),
    kst.getMonth() + 1,
    kst.getDate(),
  );
  const gzIndex = (((jdn - 2460654) % 60) + 60) % 60;
  const stemIdx = gzIndex % 10;
  const branchIdx = gzIndex % 12;
  return {
    gzIndex,
    stemIdx,
    branchIdx,
    stemKo: STEMS_KO[stemIdx]!,
    stemHanja: STEMS_HANJA[stemIdx]!,
    branchKo: BRANCHES_KO[branchIdx]!,
    branchHanja: BRANCHES_HANJA[branchIdx]!,
    stemElement: STEMS_ELEMENT[stemIdx]!,
    branchElement: BRANCHES_ELEMENT[branchIdx]!,
    branchAnimal: BRANCHES_ANIMAL[branchIdx]!,
  };
}

export {
  STEMS_KO,
  STEMS_HANJA,
  STEMS_ELEMENT,
  BRANCHES_KO,
  BRANCHES_HANJA,
  BRANCHES_ELEMENT,
  BRANCHES_ANIMAL,
};
