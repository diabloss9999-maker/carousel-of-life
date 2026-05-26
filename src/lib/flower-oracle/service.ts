/**
 * 플로로랜시 service — 알고리즘 + AI 풀이 통합.
 *
 * - 오늘의 꽃: 사용자 + 날짜 결정론적 (캐시 가능)
 * - 자유 뽑기: 매번 다른 꽃
 * - AI 풀이: 점술사 voice 매핑 (꽃 카테고리 → 캐릭터)
 */
import "server-only";

import type { Profile } from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { buildFlowerOraclePrompt } from "@/lib/ai/prompts";
import {
  flowerOracleAiSchema,
  type FlowerOracleAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { type CharacterId } from "@/lib/chat/characters";
import {
  drawDaily,
  drawRandom,
  flowerById,
} from "@/lib/flower-oracle/algorithm";
import {
  FLOWER_CHARACTER_BY_CATEGORY,
  type FlowerCard,
} from "@/lib/flower-oracle/flowers";

export type FlowerOracleMode = "daily" | "free";

export interface FlowerOracleInput {
  profile: Profile;
  mode: FlowerOracleMode;
  /** 자유 뽑기 시 제외할 꽃 ID (직전 카드 등). */
  excludeIds?: string[];
  /** 강제 카드 (테스트용). */
  forceFlowerId?: string;
}

export interface FlowerOracleResult extends FlowerOracleAiOutput {
  flower: FlowerCard;
  characterId: CharacterId;
  mode: FlowerOracleMode;
}

export async function generateFlowerOracle(
  input: FlowerOracleInput,
): Promise<FlowerOracleResult> {
  // 1) 카드 결정
  let flower: FlowerCard;
  if (input.forceFlowerId) {
    const f = flowerById(input.forceFlowerId);
    if (!f) throw new Error(`존재하지 않는 꽃 ID: ${input.forceFlowerId}`);
    flower = f;
  } else if (input.mode === "daily") {
    const fe =
      (input.profile.fiveElements as Record<string, number> | null) ?? null;
    flower = drawDaily({ userId: input.profile.userId, fiveElements: fe });
  } else {
    flower = drawRandom(input.excludeIds ?? []);
  }

  // 2) 점술사 voice 매핑
  const characterId: CharacterId = FLOWER_CHARACTER_BY_CATEGORY[flower.category];
  const voice = CHARACTER_CARD_VOICE[characterId];

  // 3) AI 풀이 — Claude Haiku
  const userPrompt = buildFlowerOraclePrompt({
    profile: input.profile,
    flower: {
      koreanName: flower.koreanName,
      scientificName: flower.scientificName,
      category: flower.category,
      meaning: flower.meaning,
      keywords: flower.keywords,
      season: flower.season,
    },
    mode: input.mode,
  });

  const ai = await generateJson({
    systemSuffix: voice,
    userPrompt,
    schema: flowerOracleAiSchema,
    model: AI_MODELS.fast,
    maxTokens: 600,
  });

  return {
    ...ai,
    flower,
    characterId,
    mode: input.mode,
  };
}
