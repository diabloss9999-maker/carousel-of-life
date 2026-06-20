import { randomInt } from "crypto";

import { FLOWERS, FLOWERS_BY_ID, type FlowerCard } from "./flowers";

function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export interface DrawDailyInput {
  userId: string;
  fiveElements?: Record<string, number> | null;
  date?: string;
}

export function drawDaily(input: DrawDailyInput): FlowerCard {
  const date = input.date ?? todayKst();
  const seed = hash32(`${input.userId}::${date}`);
  let index = seed % FLOWERS.length;

  if (input.fiveElements) {
    index = (index + elementOffset(input.fiveElements, seed)) % FLOWERS.length;
  }

  return FLOWERS[index];
}

function elementOffset(fiveElements: Record<string, number>, seed: number): number {
  const entries = Object.entries(fiveElements).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 0;

  const [topElement] = entries[0];
  const bias = (seed >>> 8) % 4;

  switch (topElement) {
    case "wood":
    case "목":
      return bias;
    case "fire":
    case "화":
      return bias + 4;
    case "earth":
    case "토":
      return bias + 8;
    case "metal":
    case "금":
      return bias + 12;
    case "water":
    case "수":
      return bias + 16;
    default:
      return 0;
  }
}

export function drawRandom(excludeIds: string[] = []): FlowerCard {
  const available = FLOWERS.filter((flower) => !excludeIds.includes(flower.id));
  if (available.length === 0) {
    return FLOWERS[randomInt(0, FLOWERS.length)];
  }
  return available[randomInt(0, available.length)];
}

export function flowerById(id: string): FlowerCard | null {
  return FLOWERS_BY_ID.get(id) ?? null;
}
