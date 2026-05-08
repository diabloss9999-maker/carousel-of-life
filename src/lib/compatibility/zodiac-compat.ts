/**
 * 12 별자리 × 12 = 144 조합 정적 궁합 테이블.
 *
 * 점수와 한 줄 설명만 제공한다 (AI 호출 없음).
 *
 * 점수 산정 규칙:
 *  - 같은 원소(불·흙·바람·물): 75 ~ 85
 *  - 보완 원소 (불-바람, 흙-물): 78 ~ 88
 *  - 충돌 원소 (불-물, 흙-바람): 50 ~ 65
 *  - 같은 별자리: 70
 *  - 별자리 데이터의 compatible/incompatible 보정: ±10
 */
import { ZODIAC_LIST, type ZodiacInfo, type ZodiacSign } from "@/lib/fortunes/zodiac";

type Element = "fire" | "earth" | "air" | "water";

const ELEMENT: Record<ZodiacSign, Element> = {
  aries: "fire",
  leo: "fire",
  sagittarius: "fire",
  taurus: "earth",
  virgo: "earth",
  capricorn: "earth",
  gemini: "air",
  libra: "air",
  aquarius: "air",
  cancer: "water",
  scorpio: "water",
  pisces: "water",
};

const ELEMENT_KO: Record<Element, string> = {
  fire: "불",
  earth: "흙",
  air: "바람",
  water: "물",
};

export interface ZodiacCompatResult {
  me: ZodiacInfo;
  partner: ZodiacInfo;
  score: number;
  headline: string;
  detail: string;
}

/**
 * 두 원소가 보완 관계인지 판단.
 */
function isComplementary(a: Element, b: Element): boolean {
  return (
    (a === "fire" && b === "air") ||
    (a === "air" && b === "fire") ||
    (a === "earth" && b === "water") ||
    (a === "water" && b === "earth")
  );
}

/**
 * 두 원소가 충돌 관계인지 판단.
 */
function isClashing(a: Element, b: Element): boolean {
  return (
    (a === "fire" && b === "water") ||
    (a === "water" && b === "fire") ||
    (a === "earth" && b === "air") ||
    (a === "air" && b === "earth")
  );
}

/**
 * 두 별자리의 궁합 점수를 결정적으로 계산한다.
 */
function computeScore(me: ZodiacSign, partner: ZodiacSign): number {
  const ea = ELEMENT[me];
  const eb = ELEMENT[partner];

  let base: number;
  if (me === partner) {
    base = 70;
  } else if (ea === eb) {
    base = 80;
  } else if (isComplementary(ea, eb)) {
    base = 85;
  } else if (isClashing(ea, eb)) {
    base = 58;
  } else {
    base = 68;
  }

  const meInfo = ZODIAC_LIST.find((z) => z.id === me)!;
  const partnerKo = ZODIAC_LIST.find((z) => z.id === partner)!.ko;

  if (meInfo.compatible.includes(partnerKo)) base += 8;
  if (meInfo.incompatible.includes(partnerKo)) base -= 10;

  // 별자리 인덱스 차이로 미세한 다양성 부여 (±3, 결정적).
  const idxA = ZODIAC_LIST.findIndex((z) => z.id === me);
  const idxB = ZODIAC_LIST.findIndex((z) => z.id === partner);
  const diff = Math.abs(idxA - idxB);
  const tweak = (diff % 7) - 3;

  const score = Math.max(20, Math.min(98, base + tweak));
  return score;
}

/**
 * 점수 기반 한 줄 헤드라인.
 */
function buildHeadline(score: number, me: ZodiacInfo, partner: ZodiacInfo): string {
  if (score >= 85) {
    return `${me.ko} × ${partner.ko}: 별자리가 점지한 환상의 짝꿍이야.`;
  }
  if (score >= 70) {
    return `${me.ko} × ${partner.ko}: 서로의 빈자리를 채워주는 좋은 인연이야.`;
  }
  if (score >= 55) {
    return `${me.ko} × ${partner.ko}: 노력하면 서로 배울 게 많은 사이야.`;
  }
  return `${me.ko} × ${partner.ko}: 부딪힐 일이 많지만 그래서 더 끌릴 수도 있어.`;
}

/**
 * 두 별자리의 디테일한 궁합 풀이.
 */
function buildDetail(me: ZodiacInfo, partner: ZodiacInfo): string {
  const ea = ELEMENT[me.id];
  const eb = ELEMENT[partner.id];
  const sameElement = ea === eb;
  const complementary = isComplementary(ea, eb);
  const clashing = isClashing(ea, eb);

  if (me.id === partner.id) {
    return `같은 ${me.ko}끼리는 닮은 만큼 마음을 빨리 알아채. 다만 비슷한 단점도 같이 갖고 있으니, 한 사람이 중심을 잡아주면 더 단단해져.`;
  }
  if (sameElement) {
    return `둘 다 ${ELEMENT_KO[ea]}의 기운을 가진 사이라 가치관과 리듬이 비슷해. 큰 갈등은 적지만 자극이 부족할 수 있으니, 새로운 경험을 함께 만들어보면 관계가 훨씬 깊어져.`;
  }
  if (complementary) {
    return `${ELEMENT_KO[ea]}과 ${ELEMENT_KO[eb]}는 서로를 끌어올려주는 관계야. ${me.ko}의 ${ea === "fire" ? "추진력" : ea === "air" ? "유연함" : ea === "earth" ? "안정감" : "감수성"}과 ${partner.ko}의 ${eb === "fire" ? "열정" : eb === "air" ? "아이디어" : eb === "earth" ? "현실감각" : "공감력"}이 만나면 함께 멀리 갈 수 있어.`;
  }
  if (clashing) {
    return `${ELEMENT_KO[ea]}과 ${ELEMENT_KO[eb]}는 속도와 방식이 달라 처음엔 부딪힐 수 있어. 하지만 그 차이를 인정하고 대화를 이어가면, 서로 다른 시야가 오히려 큰 무기가 돼.`;
  }
  return `${me.ko}와 ${partner.ko}는 비슷한 듯 다른 매력을 가졌어. 처음엔 신선한 호기심으로 끌리고, 서로의 다름을 받아들이면 오래갈 수 있는 관계야.`;
}

/**
 * 두 별자리의 궁합을 정적 테이블에서 계산해 반환.
 */
export function getZodiacCompat(
  me: ZodiacSign,
  partner: ZodiacSign,
): ZodiacCompatResult {
  const meInfo = ZODIAC_LIST.find((z) => z.id === me)!;
  const partnerInfo = ZODIAC_LIST.find((z) => z.id === partner)!;
  const score = computeScore(me, partner);
  return {
    me: meInfo,
    partner: partnerInfo,
    score,
    headline: buildHeadline(score, meInfo, partnerInfo),
    detail: buildDetail(meInfo, partnerInfo),
  };
}
