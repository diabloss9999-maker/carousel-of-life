import { ZODIAC_LIST, type ZodiacInfo, type ZodiacSign } from "@/lib/fortunes/zodiac";

type Element = "fire" | "earth" | "air" | "water";
type Locale = "ko" | "en";

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

const ELEMENT_LABEL: Record<Element, string> = {
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

function isComplementary(a: Element, b: Element): boolean {
  return (
    (a === "fire" && b === "air") ||
    (a === "air" && b === "fire") ||
    (a === "earth" && b === "water") ||
    (a === "water" && b === "earth")
  );
}

function isClashing(a: Element, b: Element): boolean {
  return (
    (a === "fire" && b === "water") ||
    (a === "water" && b === "fire") ||
    (a === "earth" && b === "air") ||
    (a === "air" && b === "earth")
  );
}

function computeScore(me: ZodiacSign, partner: ZodiacSign): number {
  const myElement = ELEMENT[me];
  const partnerElement = ELEMENT[partner];

  let base: number;
  if (me === partner) base = 72;
  else if (myElement === partnerElement) base = 80;
  else if (isComplementary(myElement, partnerElement)) base = 86;
  else if (isClashing(myElement, partnerElement)) base = 58;
  else base = 68;

  const meInfo = ZODIAC_LIST.find((zodiac) => zodiac.id === me)!;
  const partnerKo = ZODIAC_LIST.find((zodiac) => zodiac.id === partner)!.ko;
  if (meInfo.compatible.includes(partnerKo)) base += 8;
  if (meInfo.incompatible.includes(partnerKo)) base -= 10;

  const myIndex = ZODIAC_LIST.findIndex((zodiac) => zodiac.id === me);
  const partnerIndex = ZODIAC_LIST.findIndex((zodiac) => zodiac.id === partner);
  const tweak = (Math.abs(myIndex - partnerIndex) % 7) - 3;

  return Math.max(20, Math.min(98, base + tweak));
}

function buildHeadline(score: number, me: ZodiacInfo, partner: ZodiacInfo): string {
  if (score >= 85) {
    return `${me.ko} × ${partner.ko}: 서로의 장점을 자연스럽게 끌어내는 조합이에요.`;
  }
  if (score >= 70) {
    return `${me.ko} × ${partner.ko}: 편하게 맞춰가기 좋은 흐름이에요.`;
  }
  if (score >= 55) {
    return `${me.ko} × ${partner.ko}: 차이를 이해하면 충분히 좋아질 수 있어요.`;
  }
  return `${me.ko} × ${partner.ko}: 속도와 표현 방식을 조율하는 것이 중요해요.`;
}

function buildDetail(me: ZodiacInfo, partner: ZodiacInfo): string {
  const myElement = ELEMENT[me.id];
  const partnerElement = ELEMENT[partner.id];

  if (me.id === partner.id) {
    return `같은 ${me.ko}라 감정의 결을 빠르게 알아차리는 편이에요. 다만 같은 장점이 반복될 수 있으니, 한 사람은 중심을 잡고 다른 한 사람은 여지를 남겨주면 관계가 더 단단해져요.`;
  }
  if (myElement === partnerElement) {
    return `두 사람 모두 ${ELEMENT_LABEL[myElement]}의 기운이 강해서 가치관과 리듬이 자연스럽게 맞아요. 안정감은 좋지만 새로움이 부족할 수 있으니, 함께 작은 변화를 만들어가면 관계가 깊어져요.`;
  }
  if (isComplementary(myElement, partnerElement)) {
    return `${ELEMENT_LABEL[myElement]}과 ${ELEMENT_LABEL[partnerElement]}의 기운이 서로를 받쳐주는 관계예요. 한쪽의 추진력과 다른 쪽의 균형감이 만나면 함께 멀리 갈 수 있어요.`;
  }
  if (isClashing(myElement, partnerElement)) {
    return `${ELEMENT_LABEL[myElement]}과 ${ELEMENT_LABEL[partnerElement]}은 속도와 표현 방식이 달라 초반에는 부딪칠 수 있어요. 차이를 틀림이 아니라 스타일로 받아들이면 서로에게 좋은 자극이 될 수 있어요.`;
  }
  return `${me.ko}와 ${partner.ko}는 비슷한 부분과 다른 매력이 함께 있어요. 처음의 호기심을 꾸준한 대화로 이어가면 오래가는 인연으로 발전할 수 있어요.`;
}

export function getZodiacCompat(
  me: ZodiacSign,
  partner: ZodiacSign,
  _locale: Locale = "ko",
): ZodiacCompatResult {
  void _locale;
  const meInfo = ZODIAC_LIST.find((zodiac) => zodiac.id === me)!;
  const partnerInfo = ZODIAC_LIST.find((zodiac) => zodiac.id === partner)!;
  const score = computeScore(me, partner);
  return {
    me: meInfo,
    partner: partnerInfo,
    score,
    headline: buildHeadline(score, meInfo, partnerInfo),
    detail: buildDetail(meInfo, partnerInfo),
  };
}
