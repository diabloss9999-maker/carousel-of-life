import {
  CHINESE_ZODIAC_LIST,
  type ChineseZodiacInfo,
  type ChineseZodiacSign,
} from "@/lib/fortunes/zodiac";

type Locale = "ko" | "en";

const SAMHAP: ChineseZodiacSign[][] = [
  ["rat", "dragon", "monkey"],
  ["ox", "snake", "rooster"],
  ["tiger", "horse", "dog"],
  ["rabbit", "goat", "pig"],
];

const YUKHAP: [ChineseZodiacSign, ChineseZodiacSign][] = [
  ["rat", "ox"],
  ["tiger", "pig"],
  ["rabbit", "dog"],
  ["dragon", "rooster"],
  ["snake", "monkey"],
  ["horse", "goat"],
];

const SANGCHUNG: [ChineseZodiacSign, ChineseZodiacSign][] = [
  ["rat", "horse"],
  ["ox", "goat"],
  ["tiger", "monkey"],
  ["rabbit", "rooster"],
  ["dragon", "dog"],
  ["snake", "pig"],
];

export type ChineseZodiacRelation =
  | "self"
  | "samhap"
  | "yukhap"
  | "sangchung"
  | "general";

export interface ChineseZodiacCompatResult {
  me: ChineseZodiacInfo;
  partner: ChineseZodiacInfo;
  score: number;
  relationType: string;
  relationKind: ChineseZodiacRelation;
  headline: string;
  detail: string;
}

function pairIncludes(
  pairs: [ChineseZodiacSign, ChineseZodiacSign][],
  a: ChineseZodiacSign,
  b: ChineseZodiacSign,
): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function isSamhap(a: ChineseZodiacSign, b: ChineseZodiacSign): boolean {
  return SAMHAP.some((group) => group.includes(a) && group.includes(b) && a !== b);
}

function isYukhap(a: ChineseZodiacSign, b: ChineseZodiacSign): boolean {
  return pairIncludes(YUKHAP, a, b);
}

function isSangchung(a: ChineseZodiacSign, b: ChineseZodiacSign): boolean {
  return pairIncludes(SANGCHUNG, a, b);
}

function relationKind(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
): ChineseZodiacRelation {
  if (me === partner) return "self";
  if (isSamhap(me, partner)) return "samhap";
  if (isYukhap(me, partner)) return "yukhap";
  if (isSangchung(me, partner)) return "sangchung";
  return "general";
}

function computeScore(me: ChineseZodiacSign, partner: ChineseZodiacSign): number {
  if (me === partner) return 72;
  if (isSamhap(me, partner)) return 92;
  if (isYukhap(me, partner)) return 87;
  if (isSangchung(me, partner)) return 45;

  const meInfo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === me)!;
  const partnerKo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === partner)!.ko;
  let base = 65;
  if (meInfo.compatible.includes(partnerKo)) base += 10;
  if (meInfo.incompatible.includes(partnerKo)) base -= 12;

  const myIndex = CHINESE_ZODIAC_LIST.findIndex((zodiac) => zodiac.id === me);
  const partnerIndex = CHINESE_ZODIAC_LIST.findIndex((zodiac) => zodiac.id === partner);
  const tweak = (Math.abs(myIndex - partnerIndex) % 7) - 3;
  return Math.max(20, Math.min(98, base + tweak));
}

const RELATION_LABEL: Record<ChineseZodiacRelation, string> = {
  self: "같은 띠",
  samhap: "삼합",
  yukhap: "육합",
  sangchung: "상충",
  general: "일반",
};

function buildHeadline(
  score: number,
  me: ChineseZodiacInfo,
  partner: ChineseZodiacInfo,
): string {
  if (score >= 88) {
    return `${me.ko} × ${partner.ko}: 오래 갈수록 신뢰가 깊어지는 좋은 조합이에요.`;
  }
  if (score >= 75) {
    return `${me.ko} × ${partner.ko}: 편안하고 정이 쌓이는 흐름이에요.`;
  }
  if (score >= 55) {
    return `${me.ko} × ${partner.ko}: 서로의 속도를 맞추면 좋아질 수 있어요.`;
  }
  return `${me.ko} × ${partner.ko}: 기운이 부딪히기 쉬워 대화 방식이 중요해요.`;
}

function buildDetail(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
  score: number,
): string {
  const myInfo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === me)!;
  const partnerInfo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === partner)!;

  if (me === partner) {
    return `같은 ${myInfo.ko}라 본능적으로 통하는 부분이 많아요. 다만 비슷한 고집이나 약점도 반복될 수 있으니, 한 사람이 먼저 여유를 보여주면 관계가 안정돼요.`;
  }
  if (isSamhap(me, partner)) {
    return `${myInfo.ko}와 ${partnerInfo.ko}는 삼합으로 서로의 방향을 자연스럽게 받쳐주는 관계예요. 함께 목표를 세우면 신뢰가 빠르게 깊어지고 오래가는 힘이 생겨요.`;
  }
  if (isYukhap(me, partner)) {
    return `${myInfo.ko}와 ${partnerInfo.ko}는 육합으로 자연스럽게 끌리는 흐름이 있어요. 큰 노력 없이도 안정감을 주고받기 쉬운 조합이에요.`;
  }
  if (isSangchung(me, partner)) {
    return `${myInfo.ko}와 ${partnerInfo.ko}는 상충이라 오해가 생기기 쉬워요. 다만 차이를 인정하고 말의 속도를 맞추면 서로에게 강한 성장 자극이 될 수 있어요.`;
  }
  if (score >= 70) {
    return `${myInfo.ko}와 ${partnerInfo.ko}는 큰 충돌 없이 무난하게 맞춰갈 수 있어요. 서로의 장점을 인정해 주면 관계가 꾸준히 좋아져요.`;
  }
  return `${myInfo.ko}와 ${partnerInfo.ko}는 처음에는 낯설 수 있지만, 서로 다른 리듬을 받아들이면 안정적인 관계로 발전할 수 있어요.`;
}

export function getChineseZodiacCompat(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
  _locale: Locale = "ko",
): ChineseZodiacCompatResult {
  void _locale;
  const meInfo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === me)!;
  const partnerInfo = CHINESE_ZODIAC_LIST.find((zodiac) => zodiac.id === partner)!;
  const score = computeScore(me, partner);
  const kind = relationKind(me, partner);
  return {
    me: meInfo,
    partner: partnerInfo,
    score,
    relationKind: kind,
    relationType: RELATION_LABEL[kind],
    headline: buildHeadline(score, meInfo, partnerInfo),
    detail: buildDetail(me, partner, score),
  };
}
