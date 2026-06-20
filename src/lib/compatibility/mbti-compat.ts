import type { PersonalityType } from "@/lib/personality/questions";
import { TYPE_INFO, type TypeInfo } from "@/lib/personality/types";

const ALL_TYPES: PersonalityType[] = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ",
];

export const MBTI_TYPES = ALL_TYPES;

type Locale = "ko" | "en";

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

function axisMatchCount(a: PersonalityType, b: PersonalityType): number {
  let n = 0;
  for (let i = 0; i < 4; i += 1) {
    if (a[i] === b[i]) n += 1;
  }
  return n;
}

function buildHeadline(score: number, me: TypeInfo, partner: TypeInfo): string {
  if (score >= 85) return `${me.type} × ${partner.type}: 서로의 빈칸을 자연스럽게 채워주는 조합이에요.`;
  if (score >= 70) return `${me.type} × ${partner.type}: 일상 리듬이 잘 맞는 편안한 조합이에요.`;
  if (score >= 55) return `${me.type} × ${partner.type}: 조금만 맞춰가면 충분히 통할 수 있어요.`;
  return `${me.type} × ${partner.type}: 다름이 많지만 배울 점도 큰 조합이에요.`;
}

function buildDetail(
  me: TypeInfo,
  partner: TypeInfo,
  labels: MbtiCompatLabels,
): string {
  const matches = axisMatchCount(me.type, partner.type);
  const meName = labels.meNickname || me.type;
  const partnerName = labels.partnerNickname || partner.type;
  const meStrength = labels.meStrength0 || "강점";
  const partnerStrength = labels.partnerStrength0 || "강점";

  if (me.compatibleWith.includes(partner.type)) {
    return `${meName}와 ${partnerName}는 서로에게 부족한 부분을 자연스럽게 채워주는 관계예요. ${me.type}의 ${meStrength}, ${partner.type}의 ${partnerStrength}가 만나면 함께 있을수록 안정감이 커져요.`;
  }
  if (me.incompatibleWith.includes(partner.type)) {
    return `${meName}와 ${partnerName}는 우선순위와 표현 방식이 달라 처음엔 부딪힐 수 있어요. 차이를 인정하고 솔직하게 말하면 서로에게 좋은 자극이 되는 관계로 바뀔 수 있어요.`;
  }
  if (matches >= 3) {
    return `네 축 중 ${matches}개가 같아서 일상의 속도와 결정 방식이 비슷해요. 편안함은 크지만 비슷한 약점도 공유할 수 있으니, 가끔 다른 관점을 의식적으로 들여오면 균형이 좋아져요.`;
  }
  if (matches === 2) {
    return `반은 닮고 반은 다른 조합이에요. 익숙함과 새로움이 함께 있어서 대화가 잘 이어지면 서로에게 안정감과 자극을 동시에 줄 수 있어요.`;
  }
  return `${meName}와 ${partnerName}는 생각하고 움직이는 방식이 꽤 달라요. 답답함이 생길 수 있지만, 바로 그 차이 덕분에 서로의 세계를 넓혀줄 수 있어요.`;
}

export function getMbtiCompat(
  me: PersonalityType,
  partner: PersonalityType,
  _locale: Locale = "ko",
  labels: MbtiCompatLabels = {
    meNickname: me,
    partnerNickname: partner,
    meStrength0: "",
    partnerStrength0: "",
  },
): MbtiCompatResult {
  void _locale;
  const meInfo = TYPE_INFO[me];
  const partnerInfo = TYPE_INFO[partner];
  const matches = axisMatchCount(me, partner);

  let base: number;
  switch (matches) {
    case 4:
      base = 78;
      break;
    case 3:
      base = 72;
      break;
    case 2:
      base = 68;
      break;
    case 1:
      base = 60;
      break;
    default:
      base = 55;
      break;
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
    headline: buildHeadline(score, meInfo, partnerInfo),
    detail: buildDetail(meInfo, partnerInfo, labels),
  };
}
