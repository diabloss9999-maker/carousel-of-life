/**
 * 엘더 푸타르크 룬 뽑기 유틸리티.
 *
 * Node crypto.randomInt 기반 Fisher-Yates 셔플로 균등 분포를 보장한다.
 * 역방향(머크스타브)은 룬의 `isInvertible` 가 true 일 때 50% 확률.
 */
import "server-only";

import { randomInt } from "node:crypto";

import { RUNE_DECK, type RuneCard } from "@/lib/runes/cards";

export type RuneSpread = "single" | "three" | "five" | "nine";

/** 뽑힌 룬 한 개의 상태. */
export interface DrawnRune {
  rune: RuneCard;
  isReversed: boolean;
}

/**
 * 덱에서 N 개의 룬을 중복 없이 뽑고 역방향 여부를 결정한다.
 *
 * @param count            뽑을 룬 개수 (1·3·5·9).
 * @param reversedEnabled  역방향 사용 여부. true 일 때 가역룬만 50% 확률로 역방향.
 */
export function drawRunes(
  count: 1 | 3 | 5 | 9,
  reversedEnabled: boolean,
): DrawnRune[] {
  if (count < 1 || count > RUNE_DECK.length) {
    throw new Error(
      `잘못된 룬 수: ${count} (1~${RUNE_DECK.length} 사이여야 함)`,
    );
  }

  // Fisher-Yates 부분 셔플: 앞쪽 count 개만 무작위로 채운다.
  const indices = Array.from({ length: RUNE_DECK.length }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + randomInt(RUNE_DECK.length - i);
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }

  return indices.slice(0, count).map((idx) => {
    const rune = RUNE_DECK[idx]!;
    const isReversed =
      reversedEnabled && rune.isInvertible ? randomInt(2) === 1 : false;
    return { rune, isReversed };
  });
}

/** 스프레드별 위치 라벨. */
export const RUNE_SPREAD_POSITIONS: Record<RuneSpread, string[]> = {
  single: ["오늘의 룬 / 핵심 메시지"],
  three: ["과거 / 뿌리", "현재 / 핵심", "미래 / 결과"],
  five: [
    "현재 상황",
    "도전 / 장애물",
    "과거의 영향",
    "다가올 미래",
    "조언 / 결과",
  ],
  nine: [
    "과거의 환경",
    "과거의 사건",
    "과거의 영향",
    "현재의 환경",
    "현재의 핵심",
    "현재의 도전",
    "미래의 가능성",
    "미래의 사건",
    "최종 결과",
  ],
};
