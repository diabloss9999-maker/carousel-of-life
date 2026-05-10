/**
 * 르노르망 카드 뽑기 유틸리티.
 *
 * 시드 기반 PRNG 로 결정적 결과를 만들 수 있게 한다 (테스트·재현 용이).
 * 실제 운영에서는 호출자가 `Date.now()` 기반 시드를 넘긴다.
 */
import "server-only";

import { LENORMAND_DECK, type LenormandCard } from "@/lib/lenormand/cards";

export type LenormandSpread =
  | "single"
  | "three"
  | "nine"
  | "grand_tableau";

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

/**
 * 매 호출마다 새 시드를 생성한다.
 *
 * 시간(ns 정밀도) + 32-bit 난수 XOR 로 충돌 가능성을 최소화한다.
 */
function freshSeed(): number {
  const ts = Date.now();
  const rnd = Math.floor(Math.random() * 0xffffffff);
  return (ts ^ rnd) | 0;
}

/**
 * 9장 (3×3 박스) 르노르망 스프레드.
 *
 * 위치 의미:
 * - [0][1][2] : 상단 — 과거/배경
 * - [3][4][5] : 중단 — 현재/핵심 (4번이 중심 카드)
 * - [6][7][8] : 하단 — 미래/결과
 */
export function drawNineCards(): LenormandCard[] {
  return drawLenormand(9, freshSeed());
}

/**
 * 그랑 타블로 (Grand Tableau) — 36장 전체 스프레드.
 *
 * 일반적으로 8×4 그리드(32장) + 하단 영혼 카드 4장으로 배치한다.
 */
export function drawGrandTableau(): LenormandCard[] {
  return drawLenormand(36, freshSeed());
}
