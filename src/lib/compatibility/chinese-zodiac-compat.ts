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

type Locale = "ko" | "en";

/** locale 에 맞는 띠 이름. */
const ZODIAC_NAME_EN: Record<ChineseZodiacSign, string> = {
  rat: "Rat",
  ox: "Ox",
  tiger: "Tiger",
  rabbit: "Rabbit",
  dragon: "Dragon",
  snake: "Snake",
  horse: "Horse",
  goat: "Goat",
  monkey: "Monkey",
  rooster: "Rooster",
  dog: "Dog",
  pig: "Pig",
};

function zodiacName(info: ChineseZodiacInfo, locale: Locale): string {
  return locale === "en" ? ZODIAC_NAME_EN[info.id] : info.ko;
}

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

/** 관계 유형 enum (locale 무관). */
export type ChineseZodiacRelation =
  | "self"
  | "samhap"
  | "yukhap"
  | "sangchung"
  | "general";

function buildRelationKind(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
): ChineseZodiacRelation {
  if (me === partner) return "self";
  if (isSamhap(me, partner)) return "samhap";
  if (isYukhap(me, partner)) return "yukhap";
  if (isSangchung(me, partner)) return "sangchung";
  return "general";
}

const RELATION_TYPE_LABEL: Record<Locale, Record<ChineseZodiacRelation, string>> = {
  ko: {
    self: "동갑띠",
    samhap: "삼합",
    yukhap: "육합",
    sangchung: "상충",
    general: "일반",
  },
  en: {
    self: "Same sign",
    samhap: "Samhap (triad)",
    yukhap: "Yukhap (pair)",
    sangchung: "Sangchung (clash)",
    general: "General",
  },
};

function buildHeadline(
  score: number,
  me: ChineseZodiacInfo,
  partner: ChineseZodiacInfo,
  locale: Locale,
): string {
  const mName = zodiacName(me, locale);
  const pName = zodiacName(partner, locale);
  if (locale === "en") {
    if (score >= 88) return `${mName} × ${pName}: a top-tier match the heavens seem to have set up.`;
    if (score >= 75) return `${mName} × ${pName}: a comfortable, dependable connection.`;
    if (score >= 55) return `${mName} × ${pName}: with effort you can build a good relationship.`;
    return `${mName} × ${pName}: the energies clash easily, but understanding turns it around.`;
  }
  if (score >= 88) return `${mName} × ${pName}: 하늘이 맺어준 최상의 짝이야.`;
  if (score >= 75) return `${mName} × ${pName}: 서로 잘 통하고 의지가 되는 사이야.`;
  if (score >= 55) return `${mName} × ${pName}: 노력하면 좋은 관계를 만들 수 있어.`;
  return `${mName} × ${pName}: 기운이 충돌하기 쉽지만 이해하면 달라져.`;
}

function buildDetail(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
  score: number,
  locale: Locale,
): string {
  const mInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === me)!;
  const pInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === partner)!;
  const mName = zodiacName(mInfo, locale);
  const pName = zodiacName(pInfo, locale);

  if (locale === "en") {
    if (me === partner) {
      return `Two ${mName} signs read each other quickly thanks to similar instincts — but you may share the same blind spots. When one of you holds the center, the relationship becomes rock-solid.`;
    }
    if (isSamhap(me, partner)) {
      return `${mName} and ${pName} form a samhap — one of the strongest possible combos. You face the same direction and amplify each other's energy. The longer you stay together, the deeper the trust.`;
    }
    if (isYukhap(me, partner)) {
      return `${mName} and ${pName} form a yukhap — a yin-yang pair that pulls together naturally. Things flow without much effort and the bond tends to last.`;
    }
    if (isSangchung(me, partner)) {
      return `${mName} and ${pName} sit in sangchung — clashing energies. Misunderstandings come easily, but if you accept the difference and keep talking, the friction can become a real engine for growth.`;
    }
    if (score >= 70) {
      return `${mName} and ${pName} get along without much drama. You can share each other's strengths naturally; keep expressing what matters and it deepens steadily.`;
    }
    return `${mName} and ${pName} may feel unfamiliar at first — different paces, different styles. Stay open to the differences and a lasting connection is very much on the table.`;
  }

  if (me === partner) {
    return `같은 ${mName}끼리는 서로의 마음을 금방 알아차려. 비슷한 기질 덕분에 이해가 빠르지만, 같은 단점도 함께 가질 수 있어. 한 사람이 중심을 잡아주면 아주 든든한 관계가 돼.`;
  }
  if (isSamhap(me, partner)) {
    return `${mName}와 ${pName}는 삼합으로 묶인 최고의 조합이야. 같은 방향을 바라보며 서로의 에너지를 증폭시키고, 함께라면 무엇이든 이뤄낼 수 있는 최강 파트너야. 오래 사귈수록 믿음이 깊어지는 관계야.`;
  }
  if (isYukhap(me, partner)) {
    return `${mName}와 ${pName}는 음양이 맞는 육합 사이야. 자연스럽게 서로를 끌어당기고 함께 있을 때 편안함을 느껴. 큰 노력 없이도 호흡이 잘 맞아 오래 가는 안정적인 인연이 될 수 있어.`;
  }
  if (isSangchung(me, partner)) {
    return `${mName}와 ${pName}는 상충 관계야. 서로의 기운이 충돌하기 쉬워 오해와 갈등이 생길 수 있어. 하지만 다름을 인정하고 대화를 꾸준히 이어간다면, 그 충돌이 오히려 두 사람을 성장시키는 힘이 될 수 있어.`;
  }
  if (score >= 70) {
    return `${mName}와 ${pName}는 무난하게 잘 통하는 사이야. 크게 충돌하지 않고 서로의 장점을 자연스럽게 나눌 수 있어. 꾸준히 마음을 표현하면 더 깊고 좋은 관계로 발전할 수 있어.`;
  }
  return `${mName}와 ${pName}는 처음엔 낯설게 느껴질 수 있어. 서로의 속도와 방식이 달라 조율이 필요하지만, 다름을 받아들이면 오래 가는 인연이 될 수 있어.`;
}

export interface ChineseZodiacCompatResult {
  me: ChineseZodiacInfo;
  partner: ChineseZodiacInfo;
  score: number;
  relationType: string;
  relationKind: ChineseZodiacRelation;
  headline: string;
  detail: string;
}

/**
 * 두 띠의 궁합을 정적 테이블에서 계산해 반환한다.
 *
 * @param locale 표시 언어 ("ko" | "en"). 기본 "ko".
 */
export function getChineseZodiacCompat(
  me: ChineseZodiacSign,
  partner: ChineseZodiacSign,
  locale: Locale = "ko",
): ChineseZodiacCompatResult {
  const meInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === me)!;
  const partnerInfo = CHINESE_ZODIAC_LIST.find((z) => z.id === partner)!;
  const score = computeScore(me, partner);
  const relationKind = buildRelationKind(me, partner);
  return {
    me: meInfo,
    partner: partnerInfo,
    score,
    relationKind,
    relationType: RELATION_TYPE_LABEL[locale][relationKind],
    headline: buildHeadline(score, meInfo, partnerInfo, locale),
    detail: buildDetail(me, partner, score, locale),
  };
}
