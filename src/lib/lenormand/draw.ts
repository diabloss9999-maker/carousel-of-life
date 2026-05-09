/**
 * 르노르망 카드 뽑기 유틸리티.
 *
 * 시드 기반 PRNG 로 결정적 결과를 만들 수 있게 한다 (테스트·재현 용이).
 * 실제 운영에서는 호출자가 `Date.now()` 기반 시드를 넘긴다.
 */
import "server-only";

import { LENORMAND_DECK, type LenormandCard } from "@/lib/lenormand/cards";

export type LenormandSpread = "single" | "three";

export interface DrawnLenormand {
  spread: LenormandSpread;
  cards: LenormandCard[];
}

/**
 * 시드 기반 의사 난수 생성기 (LCG).
 *
 * 같은 시드는 같은 시퀀스를 보장한다.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

/**
 * 덱에서 N 장의 카드를 중복 없이 뽑는다.
 *
 * @param count 뽑을 카드 수 (1~36).
 * @param seed 난수 시드.
 */
export function drawLenormand(count: number, seed: number): LenormandCard[] {
  if (count < 1 || count > LENORMAND_DECK.length) {
    throw new Error(
      `잘못된 카드 수: ${count} (1~${LENORMAND_DECK.length} 사이여야 함)`,
    );
  }

  const rand = seededRandom(seed);
  const deck = [...LENORMAND_DECK];
  const drawn: LenormandCard[] = [];

  for (let i = 0; i < count && deck.length > 0; i++) {
    const idx = Math.floor(rand() * deck.length);
    const picked = deck[idx];
    if (!picked) break;
    drawn.push(picked);
    deck.splice(idx, 1);
  }

  return drawn;
}
