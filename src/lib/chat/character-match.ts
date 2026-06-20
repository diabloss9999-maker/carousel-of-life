/**
 * 유저 MBTI ↔ 9명 멤버 궁합 계산.
 *
 * 기존 mbti-compat 의 통념 기반 궁합표(getMbtiCompat)를 재사용해
 * 사용자에게 "가장 잘 맞는 멤버" 를 추천한다.
 *
 * (server-only 의존성 없음 — 클라이언트에서도 사용 가능)
 */
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { getMbtiCompat } from "@/lib/compatibility/mbti-compat";
import type { PersonalityType } from "@/lib/personality/questions";

export interface CharacterMatch {
  characterId: CharacterId;
  /** 멤버 MBTI */
  mbti: PersonalityType;
  /** 궁합 점수 0~98 */
  score: number;
}

/** 유효한 MBTI 4글자인지 검사. */
function isValidMbti(v: string | null | undefined): v is PersonalityType {
  return !!v && /^[EI][NS][TF][JP]$/.test(v);
}

/**
 * 유저 MBTI 와 9명 멤버의 궁합을 계산해 점수 내림차순으로 반환.
 *
 * @param userMbti 유저 프로필 MBTI (없거나 잘못되면 null 반환)
 */
export function rankCharactersByMatch(
  userMbti: string | null | undefined,
): CharacterMatch[] | null {
  if (!isValidMbti(userMbti)) return null;

  const ranked: CharacterMatch[] = (
    Object.keys(CHARACTERS) as CharacterId[]
  ).map((id) => {
    const char = CHARACTERS[id];
    const { score } = getMbtiCompat(userMbti, char.mbti, "ko");
    return { characterId: id, mbti: char.mbti, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

/**
 * 유저 MBTI 기준 멤버별 궁합 점수 맵 (characterId → score).
 * 멤버 카드에 개별 점수 표시할 때 사용.
 */
export function buildMatchScoreMap(
  userMbti: string | null | undefined,
): Record<CharacterId, number> | null {
  const ranked = rankCharactersByMatch(userMbti);
  if (!ranked) return null;
  const map = {} as Record<CharacterId, number>;
  for (const r of ranked) map[r.characterId] = r.score;
  return map;
}

/** 궁합 점수 → 한 줄 라벨. */
export function matchLabel(score: number): string {
  if (score >= 85) return "환상의 궁합";
  if (score >= 75) return "잘 맞아요";
  if (score >= 65) return "꽤 맞아요";
  if (score >= 55) return "무난해요";
  return "색다른 조합";
}
