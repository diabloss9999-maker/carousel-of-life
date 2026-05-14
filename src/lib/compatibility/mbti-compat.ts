/**
 * 16 × 16 MBTI 궁합 매트릭스.
 *
 * TYPE_INFO 의 compatibleWith / incompatibleWith 데이터에 더해
 * 4축 일치 비율로 결정적 점수를 계산한다.
 *
 * nickname / strengths 텍스트는 i18n 메시지에서 가져온 값을 호출자가 주입한다.
 */
import { TYPE_INFO, type TypeInfo } from "@/lib/personality/types";
import type { PersonalityType } from "@/lib/personality/questions";

const ALL_TYPES: PersonalityType[] = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

export const MBTI_TYPES = ALL_TYPES;

type Locale = "ko" | "en";

/** 호출자가 i18n 으로부터 가져와 주입하는 표시용 텍스트. */
export interface MbtiCompatLabels {
  meNickname: string;
  partnerNickname: string;
  meStrength0: string;
  partnerStrength0: string;
}

export interface MbtiCompatResult {
  me: TypeInfo;
  partner: TypeInfo;
  score: number;
  headline: string;
  detail: string;
}

/** 4축 비교 — 같은 축 개수. */
function axisMatchCount(a: PersonalityType, b: PersonalityType): number {
  let n = 0;
  for (let i = 0; i < 4; i += 1) if (a[i] === b[i]) n += 1;
  return n;
}

function buildHeadline(
  score: number,
  me: TypeInfo,
  partner: TypeInfo,
  locale: Locale,
): string {
  if (locale === "en") {
    if (score >= 85) return `${me.type} × ${partner.type}: soulmates — you understand each other better than most.`;
    if (score >= 70) return `${me.type} × ${partner.type}: a well-matched pair with the same grain.`;
    if (score >= 55) return `${me.type} × ${partner.type}: with a bit of effort you'll click just fine.`;
    return `${me.type} × ${partner.type}: lots of differences — and that's exactly where you can teach each other the most.`;
  }
  if (score >= 85) {
    return `${me.type} × ${partner.type}: 영혼의 단짝, 서로를 가장 잘 이해하는 짝꿍이야.`;
  }
  if (score >= 70) {
    return `${me.type} × ${partner.type}: 결이 잘 맞는 좋은 인연이야.`;
  }
  if (score >= 55) {
    return `${me.type} × ${partner.type}: 노력하면 충분히 통하는 사이야.`;
  }
  return `${me.type} × ${partner.type}: 다른 점이 많아 부딪히기 쉬워, 그만큼 배울 것도 많아.`;
}

function buildDetail(
  me: TypeInfo,
  partner: TypeInfo,
  labels: MbtiCompatLabels,
  locale: Locale,
): string {
  const matches = axisMatchCount(me.type, partner.type);

  if (locale === "en") {
    if (me.compatibleWith.includes(partner.type)) {
      return `${labels.meNickname} and ${labels.partnerNickname} fill in each other's missing pieces naturally. The ${me.type} strength of "${labels.meStrength0}" paired with the ${partner.type} strength of "${labels.partnerStrength0}" — the longer you spend together, the steadier the bond gets.`;
    }
    if (me.incompatibleWith.includes(partner.type)) {
      return `${labels.meNickname} and ${labels.partnerNickname} hold different values and priorities, so friction is likely at first. Accept the difference, keep talking honestly, and you can become each other's sharpest source of growth.`;
    }
    if (matches >= 3) {
      return `${matches} of the 4 axes are the same, so your daily rhythm and decision style line up. Conflict stays low — but you share blind spots too, so even one different perspective in the mix keeps things balanced.`;
    }
    if (matches === 2) {
      return `Half alike, half different — a mix that gives you both stimulation and a sense of safety. Lean into "${labels.meStrength0}" and "${labels.partnerStrength0}" and you make a strong team.`;
    }
    return `${labels.meNickname} and ${labels.partnerNickname} think and act in almost opposite ways. Frustrating at first, but precisely because of that you can show each other a new world. Patience is the key to this relationship.`;
  }

  if (me.compatibleWith.includes(partner.type)) {
    return `${labels.meNickname}과 ${labels.partnerNickname}은 서로의 부족한 부분을 자연스럽게 채워주는 짝이야. ${me.type}의 ${labels.meStrength0}과 ${partner.type}의 ${labels.partnerStrength0}이 만나면, 함께 있는 시간이 길수록 더 단단해져.`;
  }
  if (me.incompatibleWith.includes(partner.type)) {
    return `${labels.meNickname}과 ${labels.partnerNickname}은 가치관과 우선순위가 달라 처음엔 부딪힐 수 있어. 하지만 차이를 인정하고 솔직하게 대화하면, 서로 가장 큰 자극이 되는 관계로 발전할 수 있어.`;
  }
  if (matches >= 3) {
    return `네 축 중 ${matches}개가 같아 일상의 리듬과 결정 방식이 비슷해. 큰 갈등은 적지만 비슷한 단점도 공유하니, 한 명이라도 다른 시선을 가져주면 균형이 잡혀.`;
  }
  if (matches === 2) {
    return `반은 닮고 반은 다른 사이라, 서로에게 신선한 자극을 주면서도 안정감을 느낄 수 있어. ${labels.meStrength0}과 ${labels.partnerStrength0}을 잘 살리면 좋은 팀이 돼.`;
  }
  return `${labels.meNickname}과 ${labels.partnerNickname}은 사고와 행동 방식이 거의 정반대야. 처음엔 답답할 수 있지만, 그만큼 서로에게 새로운 세상을 보여줄 수 있어. 인내심이 관계의 열쇠야.`;
}

/**
 * 두 MBTI 의 궁합을 정적으로 계산한다.
 *
 * @param locale 표시 언어 ("ko" | "en"). 기본 "ko".
 * @param labels nickname / strengths 등 호출자가 i18n 으로부터 가져온 표시 텍스트.
 */
export function getMbtiCompat(
  me: PersonalityType,
  partner: PersonalityType,
  locale: Locale = "ko",
  labels: MbtiCompatLabels = {
    meNickname: me,
    partnerNickname: partner,
    meStrength0: "",
    partnerStrength0: "",
  },
): MbtiCompatResult {
  const meInfo = TYPE_INFO[me];
  const partnerInfo = TYPE_INFO[partner];
  const matches = axisMatchCount(me, partner);

  let base: number;
  switch (matches) {
    case 4: base = 78; break;
    case 3: base = 72; break;
    case 2: base = 68; break;
    case 1: base = 60; break;
    default: base = 55; break;
  }

  if (meInfo.compatibleWith.includes(partner)) base += 12;
  if (meInfo.incompatibleWith.includes(partner)) base -= 12;

  const idxA = ALL_TYPES.indexOf(me);
  const idxB = ALL_TYPES.indexOf(partner);
  const tweak = (Math.abs(idxA - idxB) % 5) - 2;

  const score = Math.max(20, Math.min(98, base + tweak));

  return {
    me: meInfo,
    partner: partnerInfo,
    score,
    headline: buildHeadline(score, meInfo, partnerInfo, locale),
    detail: buildDetail(meInfo, partnerInfo, labels, locale),
  };
}
