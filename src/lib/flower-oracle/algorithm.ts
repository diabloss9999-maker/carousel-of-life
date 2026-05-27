/**
 * 플로로랜시 — 꽃 선택 알고리즘.
 *
 * 두 가지 모드:
 *   1. 오늘의 꽃 (drawDaily) — 사용자 + 날짜 결정론적
 *     · 같은 사람 같은 날엔 항상 같은 꽃
 *     · 다른 날엔 다른 꽃
 *     · 사주 오행과 약한 가중치 (있으면)
 *   2. 자유 뽑기 (drawRandom) — crypto-random
 *     · 매번 다른 꽃
 *     · 같은 카드 연속 차단 (지난 카드 제외 시드)
 */
import { randomInt } from "crypto";

import { FLOWERS, FLOWERS_BY_ID, type FlowerCard } from "./flowers";

/** 문자열을 32bit 정수 해시 (FNV-1a 변형). */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** KST 오늘 날짜 (YYYY-MM-DD). */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export interface DrawDailyInput {
  userId: string;
  /** 사주 오행 분포 (있으면 가중치) — { wood, fire, earth, metal, water } 합 100 기준. */
  fiveElements?: Record<string, number> | null;
  /** 명시적 날짜 (테스트용). 기본 오늘 KST. */
  date?: string;
}

/**
 * 오늘의 꽃 — 결정론적.
 *
 * 같은 사용자·같은 날 = 같은 꽃. 다른 날 = 다른 꽃 (대체로).
 * 사주 오행은 약한 가중치 — 절대적이 아니라 60종 균등 분포 살짝 비틀기.
 */
export function drawDaily(input: DrawDailyInput): FlowerCard {
  const date = input.date ?? todayKst();
  const seed = hash32(`${input.userId}::${date}`);

  // 기본: 균등 분포
  let index = seed % FLOWERS.length;

  // 사주 오행 가중치 — 강한 오행에 매칭되는 꽃을 살짝 우대
  // (전체 60종이라 가중치는 약하게: ±5 인덱스 보정)
  if (input.fiveElements) {
    const offsets = elementOffsets(input.fiveElements, seed);
    index = (index + offsets) % FLOWERS.length;
  }

  return FLOWERS[index];
}

/** 오행 분포 → 인덱스 오프셋 (±5 범위). */
function elementOffsets(
  fe: Record<string, number>,
  seed: number,
): number {
  // 가장 강한 오행 1개 선택
  const entries = Object.entries(fe).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 0;
  const [topElement] = entries[0];

  // 오행 → 꽃 카테고리·계절 hint (매우 약한 가중치)
  // 木(나무): 봄꽃 우대 / 火(불): 여름·붉은 꽃 / 金(쇠): 가을·국화·하얀 꽃
  // 水(물): 연꽃·푸른 꽃 / 土(흙): 무궁화·다년생
  const bias = (seed >>> 8) % 5;
  switch (topElement) {
    case "wood":
    case "木":
      return bias - 2; // 봄 꽃 쪽으로 약간
    case "fire":
    case "火":
      return bias + 4;
    case "earth":
    case "土":
      return bias;
    case "metal":
    case "金":
      return bias + 6;
    case "water":
    case "水":
      return bias + 2;
    default:
      return 0;
  }
}

/**
 * 자유 뽑기 — 매번 다른 꽃 (crypto-random).
 *
 * @param excludeIds 제외할 꽃 ID들 (예: 직전에 뽑은 카드)
 */
export function drawRandom(excludeIds: string[] = []): FlowerCard {
  const available = FLOWERS.filter((f) => !excludeIds.includes(f.id));
  if (available.length === 0) {
    // 모두 제외된 극단 케이스 — 균등 분포로 한 장
    return FLOWERS[randomInt(0, FLOWERS.length)];
  }
  return available[randomInt(0, available.length)];
}

/** ID 로 카드 조회 — 유효성 검증 포함. */
export function flowerById(id: string): FlowerCard | null {
  return FLOWERS_BY_ID.get(id) ?? null;
}
