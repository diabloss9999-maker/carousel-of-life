/**
 * 타로 카드 뽑기 (셔플) 유틸리티.
 *
 * 암호학적으로 안전한 난수를 사용해 결과 변조 가능성을 줄인다.
 */
import "server-only";

import { randomInt } from "node:crypto";

import { TAROT_DECK, type TarotCard } from "@/lib/tarot/cards";

export interface DrawnCard {
  id: string;
  nameKo: string;
  nameEn: string;
  /** true = 역방향(逆位). */
  isReversed: boolean;
}

/**
 * 덱에서 N 장의 카드를 중복 없이 뽑는다.
 * 각 카드는 50% 확률로 역방향이다.
 *
 * @param count 1-78
 */
export function drawCards(count: number): DrawnCard[] {
  if (count < 1 || count > TAROT_DECK.length) {
    throw new Error(
      `잘못된 카드 수: ${count} (1~${TAROT_DECK.length} 사이여야 함)`,
    );
  }

  // Fisher-Yates shuffle 의 부분 변형: 앞쪽 count 장만 섞어도 충분.
  const indices = Array.from({ length: TAROT_DECK.length }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + randomInt(TAROT_DECK.length - i);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const drawn: DrawnCard[] = [];
  for (let i = 0; i < count; i++) {
    const card: TarotCard = TAROT_DECK[indices[i]];
    drawn.push({
      id: card.id,
      nameKo: card.nameKo,
      nameEn: card.nameEn,
      // 50% 확률로 역방향. randomInt(2) 는 0 또는 1.
      isReversed: randomInt(2) === 1,
    });
  }

  return drawn;
}
