/**
 * 포토카드 바인더 — Weverse 식 멤버 사진 수집.
 *
 * 9멤버 각각의 사진(imageSlides)을 친밀도(호감도) 레벨로 해금한다.
 * 대화·선물로 친밀도가 오를수록 그 멤버의 포토카드가 한 장씩 열린다 →
 * 채팅·선물 경제를 "사진 수집"이라는 손에 잡히는 보상에 연결하는 팬덤 그라인드 루프.
 */
import "server-only";

import { getAllAffinities } from "@/lib/affinity/service";
import { calcLevel } from "@/lib/affinity/levels";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";

export interface PhotocardSlide {
  src: string;
  unlocked: boolean;
  /** 이 사진이 열리는 친밀도 레벨. */
  unlockLevel: number;
}

export interface MemberPhotocards {
  characterId: CharacterId;
  name: string;
  level: number;
  unlockedCount: number;
  totalCount: number;
  /** 다음 한 장이 열리는 레벨(전부 열렸으면 null). */
  nextUnlockLevel: number | null;
  slides: PhotocardSlide[];
}

export interface PhotocardBinder {
  members: MemberPhotocards[];
  totalUnlocked: number;
  totalCards: number;
}

/**
 * 사진 index → 해금 레벨. 첫 장은 Lv.1(항상 공개), 이후 5레벨마다 한 장.
 * (Lv.5, 10, 15 … 50 에서 순서대로 열림)
 */
function slideUnlockLevel(index: number): number {
  return index === 0 ? 1 : index * 5;
}

export async function getPhotocardBinder(
  userId: string,
): Promise<PhotocardBinder> {
  const affinities = await getAllAffinities(userId);
  const pointsByChar = new Map<CharacterId, number>(
    affinities.map((a) => [a.characterId as CharacterId, a.points]),
  );

  const memberIds = Object.keys(CHARACTERS) as CharacterId[];
  let totalUnlocked = 0;
  let totalCards = 0;

  const members: MemberPhotocards[] = memberIds.map((id) => {
    const character = CHARACTERS[id];
    const points = pointsByChar.get(id) ?? 0;
    const { level } = calcLevel(id, points);

    const allSlides =
      character.imageSlides && character.imageSlides.length > 0
        ? character.imageSlides
        : [character.imageSrc];

    let nextUnlockLevel: number | null = null;
    const slides: PhotocardSlide[] = allSlides.map((src, i) => {
      const unlockLevel = slideUnlockLevel(i);
      const unlocked = level >= unlockLevel;
      if (!unlocked && nextUnlockLevel === null) nextUnlockLevel = unlockLevel;
      return { src, unlocked, unlockLevel };
    });

    const unlockedCount = slides.filter((s) => s.unlocked).length;
    totalUnlocked += unlockedCount;
    totalCards += slides.length;

    return {
      characterId: id,
      name: character.name,
      level,
      unlockedCount,
      totalCount: slides.length,
      nextUnlockLevel,
      slides,
    };
  });

  return { members, totalUnlocked, totalCards };
}
