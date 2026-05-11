/**
 * 12띠 × 12 = 144 조합 정적 궁합 테이블.
 *
 * 점수 산정 기준:
 *  - 삼합 (Rat-Dragon-Monkey / Ox-Snake-Rooster / Tiger-Horse-Dog / Rabbit-Goat-Pig): 90+
 *  - 육합 (인접 합충 쌍): 85+
 *  - 같은 띠: 72
 *  - 상충 (Rat-Horse / Ox-Goat / Tiger-Monkey / Rabbit-Rooster / Dragon-Dog / Snake-Pig): 45
 *  - 그 외: compatible/incompatible 보정 후 60~70
 */
import {
  CHINESE_ZODIAC_LIST,
  type ChineseZodiacInfo,
  type ChineseZodiacSign,
} from "@/lib/fortunes/zodiac";

/** 삼합 그룹 — 세 띠가 최상 궁합. */
const SAMHAP: ChineseZodiacSign[][] = [
  ["rat", "dragon", "monkey"],
  ["ox", "snake", "rooster"],
  ["tiger", "horse", "dog"],
  ["rabbit", "goat", "pig"],
];

/** 육합 쌍 — 음양이 맞아 자연스럽게 끌리는 사이. */
const YUKHAP: [ChineseZodiacSign, ChineseZodiacSign][] = [
  ["rat", "ox"],
  ["tiger", "pig"],
  ["rabbit", "dog"],
  ["dragon", "rooster"],
  ["snake", "monkey"],
  ["horse", "goat"],
];

/** 상충 쌍 — 기운이 충돌하는 사이. */
const SANGCHUNG: [ChineseZodiacSign, ChineseZodiacSign][] = [
  ["rat", "horse"],
  ["ox", "goat"],
  ["tiger", "monkey"],
  ["rabbit", "rooster"],
  ["dragon", "dog"],
  ["snake", "pig"],
];

function isSamhap(a: ChineseZodiacSign, b: ChineseZodiacSign): boolean {
  return SAMHAP.some((g) => g.includes(a) && g.includes(b) && a !== b);
}

function isYukhap(a: ChineseZodiacSign, b: ChineseZodiacSign): boolean {
  return YUKHAP.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function isSangchung(a: ChineseZodiacSign, b: ChineseZodiacSign): boolean {
  return SANGCHUNG.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

function computeScore(me: ChineseZodiacSign, partner: ChineseZodiacSign): number {
  if (me === partner) return 72;
  if (isSamhap(me, partner)) return 92;
  if (isYukhap(me, partner)) return 87;
  if (isSangchung(me, partner)) return 45;

  const meInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === me)!;
  const partnerKo = CHINESE_ZODIAC_LIST.find((z) => z.id === partner)!.ko;

  let base = 65;
  if (meInfo.compatible.includes(partnerKo)) base += 10;
  if (meInfo.incompatible.includes(partnerKo)) base -= 12;

  const idxA = CHINESE_ZODIAC_LIST.findIndex((z) => z.id === me);
  const idxB = CHINESE_ZODIAC_LIST.findIndex((z) => z.id === partner);
  const diff = Math.abs(idxA - idxB);
  const tweak = (diff % 7) - 3;

  return Math.max(20, Math.min(98, base + tweak));
}

function buildRelationType(me: ChineseZodiacSign, partner: ChineseZodiacSign): string {
  if (me === partner) return "동갑띠";
  if (isSamhap(me, partner)) return "삼합";
  if (isYukhap(me, partner)) return "육합";
  if (isSangchung(me, partner)) return "상충";
  return "일반";
}

function buildHeadline(
  score: number,
  me: ChineseZodiacInfo,
  partner: ChineseZodiacInfo,
): string {
  if (score >= 88)
    return `${me.ko} × ${partner.ko}: 하늘이 맺어준 최상의 짝이야.`;
  if (score >= 75)
    return `${me.ko} × ${partner.ko}: 서로 잘 통하고 의지가 되는 사이야.`;
  if (score >= 55)
    return `${me.ko} × ${partner.ko}: 노력하면 좋은 관계를 만들 수 있어.`;
  return `${me.ko} × ${partner.ko}: 기운이 충돌하기 쉽지만 이해하면 달라져.`;
}

function buildDetail(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
  score: number,
): string {
  const mInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === me)!;
  const pInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === partner)!;

  if (me === partner) {
    return `같은 ${mInfo.ko}끼리는 서로의 마음을 금방 알아차려. 비슷한 기질 덕분에 이해가 빠르지만, 같은 단점도 함께 가질 수 있어. 한 사람이 중심을 잡아주면 아주 든든한 관계가 돼.`;
  }
  if (isSamhap(me, partner)) {
    return `${mInfo.ko}와 ${pInfo.ko}는 삼합으로 묶인 최고의 조합이야. 같은 방향을 바라보며 서로의 에너지를 증폭시키고, 함께라면 무엇이든 이뤄낼 수 있는 최강 파트너야. 오래 사귈수록 믿음이 깊어지는 관계야.`;
  }
  if (isYukhap(me, partner)) {
    return `${mInfo.ko}와 ${pInfo.ko}는 음양이 맞는 육합 사이야. 자연스럽게 서로를 끌어당기고 함께 있을 때 편안함을 느껴. 큰 노력 없이도 호흡이 잘 맞아 오래 가는 안정적인 인연이 될 수 있어.`;
  }
  if (isSangchung(me, partner)) {
    return `${mInfo.ko}와 ${pInfo.ko}는 상충 관계야. 서로의 기운이 충돌하기 쉬워 오해와 갈등이 생길 수 있어. 하지만 다름을 인정하고 대화를 꾸준히 이어간다면, 그 충돌이 오히려 두 사람을 성장시키는 힘이 될 수 있어.`;
  }
  if (score >= 70) {
    return `${mInfo.ko}와 ${pInfo.ko}는 무난하게 잘 통하는 사이야. 크게 충돌하지 않고 서로의 장점을 자연스럽게 나눌 수 있어. 꾸준히 마음을 표현하면 더 깊고 좋은 관계로 발전할 수 있어.`;
  }
  return `${mInfo.ko}와 ${pInfo.ko}는 처음엔 낯설게 느껴질 수 있어. 서로의 속도와 방식이 달라 조율이 필요하지만, 다름을 받아들이면 오래 가는 인연이 될 수 있어.`;
}

export interface ChineseZodiacCompatResult {
  me: ChineseZodiacInfo;
  partner: ChineseZodiacInfo;
  score: number;
  relationType: string;
  headline: string;
  detail: string;
}

/**
 * 두 띠의 궁합을 정적 테이블에서 계산해 반환한다.
 */
export function getChineseZodiacCompat(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
): ChineseZodiacCompatResult {
  const meInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === me)!;
  const partnerInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === partner)!;
  const score = computeScore(me, partner);
  return {
    me: meInfo,
    partner: partnerInfo,
    score,
    relationType: buildRelationType(me, partner),
    headline: buildHeadline(score, meInfo, partnerInfo),
    detail: buildDetail(me, partner, score),
  };
}
