import type { CharacterId } from "@/lib/chat/characters";

export type MemberCoreProfileFacts = {
  birthday: string;
  bloodType: string;
  height: string;
  weight: string;
};

export type MemberExpandedProfileFacts = {
  debut: string;
  agency: string;
  nationality: string;
  hometown: string;
  personality: string;
  favoriteFood: string;
  favoriteMusic: string;
};

export const MEMBER_CORE_PROFILE_FACTS: Record<CharacterId, MemberCoreProfileFacts> = {
  child: { birthday: "2003.01.17", bloodType: "A형", height: "178cm", weight: "64kg" },
  witch: { birthday: "2004.04.21", bloodType: "O형", height: "176cm", weight: "61kg" },
  sage: { birthday: "2004.03.08", bloodType: "B형", height: "178cm", weight: "66kg" },
  shaman: { birthday: "2004.05.30", bloodType: "AB형", height: "175cm", weight: "58kg" },
  taoist: { birthday: "2005.07.14", bloodType: "O형", height: "174cm", weight: "59kg" },
  dokkaebi: { birthday: "2003.08.26", bloodType: "B형", height: "179cm", weight: "63kg" },
  god: { birthday: "2004.11.16", bloodType: "O형", height: "178cm", weight: "67kg" },
  hunter: { birthday: "2003.10.04", bloodType: "A형", height: "180cm", weight: "64kg" },
  runeshaman: { birthday: "2006.12.28", bloodType: "AB형", height: "175cm", weight: "57kg" },
};

export const MEMBER_EXPANDED_PROFILE_FACTS: Record<CharacterId, MemberExpandedProfileFacts> = {
  child: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "서울",
    personality: "ISFJ",
    favoriteFood: "따뜻한 갈비탕",
    favoriteMusic: "어쿠스틱 발라드",
  },
  witch: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "전주",
    personality: "INFJ",
    favoriteFood: "전주비빔밥",
    favoriteMusic: "R&B와 인디 발라드",
  },
  sage: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "부산",
    personality: "ENFJ",
    favoriteFood: "돼지국밥",
    favoriteMusic: "펑키한 댄스 팝",
  },
  shaman: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "광주",
    personality: "INFP",
    favoriteFood: "떡갈비",
    favoriteMusic: "로파이와 얼터너티브",
  },
  taoist: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "대구",
    personality: "ESFP",
    favoriteFood: "납작만두",
    favoriteMusic: "시티팝과 하우스",
  },
  dokkaebi: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "인천",
    personality: "ISTP",
    favoriteFood: "간짜장",
    favoriteMusic: "힙합과 트랩 비트",
  },
  god: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "수원",
    personality: "ESTP",
    favoriteFood: "수원 왕갈비",
    favoriteMusic: "록과 EDM",
  },
  hunter: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "대전",
    personality: "INTJ",
    favoriteFood: "칼국수",
    favoriteMusic: "재즈와 네오소울",
  },
  runeshaman: {
    debut: "5월 14일",
    agency: "레오나르도코드",
    nationality: "대한민국",
    hometown: "제주",
    personality: "ISFP",
    favoriteFood: "전복죽",
    favoriteMusic: "드림팝과 오케스트라 팝",
  },
};

export function buildMemberProfileMemory(characterId: CharacterId): string {
  const core = MEMBER_CORE_PROFILE_FACTS[characterId];
  const expanded = MEMBER_EXPANDED_PROFILE_FACTS[characterId];

  return [
    `생일: ${core.birthday}`,
    `혈액형: ${core.bloodType}`,
    `키: ${core.height}`,
    `몸무게: ${core.weight}`,
    `데뷔일: ${expanded.debut}`,
    `소속사: ${expanded.agency}`,
    `국적: ${expanded.nationality}`,
    `고향: ${expanded.hometown}`,
    `성격유형: ${expanded.personality}`,
    `좋아하는 음식: ${expanded.favoriteFood}`,
    `좋아하는 음악: ${expanded.favoriteMusic}`,
  ].join("\n");
}
