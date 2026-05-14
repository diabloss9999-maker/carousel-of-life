/**
 * 16가지 성격 유형의 정적 메타데이터.
 *
 * 텍스트 필드(nickname, summary, description, strengths, cautions, imageRole,
 * suitableJobs)는 i18n 메시지의 `personalityTypes.{TYPE}_{field}` 키에서 가져온다.
 */
import type { PersonalityType } from "./questions";

export interface TypeInfo {
  type: PersonalityType;
  emoji: string;
  /** 이 유형과 잘 맞는 유형. */
  compatibleWith: PersonalityType[];
  /** 주의가 필요한 유형. */
  incompatibleWith: PersonalityType[];
}

export const TYPE_INFO: Record<PersonalityType, TypeInfo> = {
  ISTJ: {
    type: "ISTJ",
    emoji: "",
    compatibleWith: ["ESFP", "ESTP"],
    incompatibleWith: ["ENFP", "ENTP"],
  },
  ISFJ: {
    type: "ISFJ",
    emoji: "",
    compatibleWith: ["ESFP", "ESTP"],
    incompatibleWith: ["ENFP", "ENTP"],
  },
  INFJ: {
    type: "INFJ",
    emoji: "",
    compatibleWith: ["ENFP", "ENTP"],
    incompatibleWith: ["ESTP", "ESFP"],
  },
  INTJ: {
    type: "INTJ",
    emoji: "",
    compatibleWith: ["ENFP", "ENTP"],
    incompatibleWith: ["ESFP", "ESTP"],
  },
  ISTP: {
    type: "ISTP",
    emoji: "",
    compatibleWith: ["ESFJ", "ESTJ"],
    incompatibleWith: ["ENFJ", "ESFP"],
  },
  ISFP: {
    type: "ISFP",
    emoji: "",
    compatibleWith: ["ESFJ", "ENFJ"],
    incompatibleWith: ["ENTJ", "ESTJ"],
  },
  INFP: {
    type: "INFP",
    emoji: "",
    compatibleWith: ["ENFJ", "ENTJ"],
    incompatibleWith: ["ESTJ", "ESTP"],
  },
  INTP: {
    type: "INTP",
    emoji: "",
    compatibleWith: ["ENTJ", "ESTJ"],
    incompatibleWith: ["ESFJ", "ESFP"],
  },
  ESTP: {
    type: "ESTP",
    emoji: "",
    compatibleWith: ["ISFJ", "ISTJ"],
    incompatibleWith: ["INFJ", "INTJ"],
  },
  ESFP: {
    type: "ESFP",
    emoji: "",
    compatibleWith: ["ISFJ", "ISTJ"],
    incompatibleWith: ["INTJ", "INFJ"],
  },
  ENFP: {
    type: "ENFP",
    emoji: "",
    compatibleWith: ["INFJ", "INTJ"],
    incompatibleWith: ["ISTJ", "ISFJ"],
  },
  ENTP: {
    type: "ENTP",
    emoji: "",
    compatibleWith: ["INFJ", "INTJ"],
    incompatibleWith: ["ISTJ", "ISFJ"],
  },
  ESTJ: {
    type: "ESTJ",
    emoji: "",
    compatibleWith: ["ISFP", "ISTP"],
    incompatibleWith: ["INFP", "INTP"],
  },
  ESFJ: {
    type: "ESFJ",
    emoji: "",
    compatibleWith: ["ISFP", "ISTP"],
    incompatibleWith: ["INTP", "INTJ"],
  },
  ENFJ: {
    type: "ENFJ",
    emoji: "",
    compatibleWith: ["INFP", "ISFP"],
    incompatibleWith: ["ISTP", "ISTJ"],
  },
  ENTJ: {
    type: "ENTJ",
    emoji: "",
    compatibleWith: ["INFP", "INTP"],
    incompatibleWith: ["ISFP", "ISFJ"],
  },
};
