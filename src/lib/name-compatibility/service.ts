/**
 * 이름 궁합 service — 알고리즘 + AI 해설을 묶어주는 비즈니스 로직.
 *
 * 1. 알고리즘으로 결정론적 점수 + 등급 계산
 * 2. Claude Haiku 로 짧은 풀이 생성 (1-2초)
 * 3. DB 저장 X — 스테이트리스 (필요 시 클라이언트 캐시)
 *
 * 점술사 톤: 소율(접신의 무녀) — 동양 캐릭터 추천. 정 다른 톤 원하면 prop 으로.
 */
import "server-only";

import { generateJson } from "@/lib/ai/generate";
import { buildNameCompatibilityPrompt } from "@/lib/ai/prompts";
import {
  nameCompatibilityAiSchema,
  type NameCompatibilityAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import {
  calculateNameCompatibility,
  type NameCompatibilityResult,
} from "@/lib/name-compatibility/algorithm";

export interface NameCompatibilityInput {
  nameA: string;
  nameB: string;
  /** 풀이해줄 점술사 — 기본 소율(동양 무녀). */
  characterId?: "shaman" | "taoist" | "witch";
}

export interface NameCompatibilityOutput
  extends NameCompatibilityResult,
    NameCompatibilityAiOutput {
  characterId: "shaman" | "taoist" | "witch";
}

const DEFAULT_CHARACTER = "shaman" as const;

export async function generateNameCompatibility(
  input: NameCompatibilityInput,
): Promise<NameCompatibilityOutput> {
  // 1) 알고리즘 — 결정론적
  const calc = calculateNameCompatibility(input.nameA, input.nameB);

  const characterId = input.characterId ?? DEFAULT_CHARACTER;
  const voice = CHARACTER_CARD_VOICE[characterId];

  // 2) AI 해설 — 짧고 빠름
  const userPrompt = buildNameCompatibilityPrompt({
    nameA: calc.normalizedNameA,
    nameB: calc.normalizedNameB,
    score: calc.score,
    gradeLabel: calc.label,
    tone: calc.tone,
  });

  const ai = await generateJson({
    systemSuffix: voice,
    userPrompt,
    schema: nameCompatibilityAiSchema,
    model: AI_MODELS.fast, // Haiku — 빠르고 저렴
    maxTokens: 500,
  });

  return {
    ...calc,
    ...ai,
    characterId,
  };
}
