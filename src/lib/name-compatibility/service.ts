/**
 * 이름 궁합 service — 알고리즘 + AI 해설을 묶어주는 비즈니스 로직.
 *
 * 1. 알고리즘으로 결정론적 점수 + 등급 계산
 * 2. Claude Haiku 로 짧은 풀이 생성 (1-2초)
 * 3. DB 저장 X — 스테이트리스 (필요 시 클라이언트 캐시)
 */
import "server-only";

import { getLocale, getTranslations } from "next-intl/server";
import { generateJson } from "@/lib/ai/generate";
import { buildNameCompatibilityPrompt } from "@/lib/ai/prompts";
import {
  nameCompatibilityAiSchema,
  type NameCompatibilityAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import { NEUTRAL_CARD_VOICE } from "@/lib/ai/character-voice";
import {
  calculateNameCompatibility,
  type NameCompatibilityResult,
} from "@/lib/name-compatibility/algorithm";

export interface NameCompatibilityInput {
  nameA: string;
  nameB: string;
}

export interface NameCompatibilityOutput
  extends NameCompatibilityResult,
    NameCompatibilityAiOutput {}

export async function generateNameCompatibility(
  input: NameCompatibilityInput,
): Promise<NameCompatibilityOutput> {
  // 1) 알고리즘 — 결정론적
  const calc = calculateNameCompatibility(input.nameA, input.nameB);
  const t = await getTranslations("nameCompatibilityLabels");
  const localizedLabel = t(calc.toneScoreKey);

  // 2) AI 해설 — 짧고 빠름
  const userPrompt = buildNameCompatibilityPrompt({
    nameA: calc.normalizedNameA,
    nameB: calc.normalizedNameB,
    score: calc.score,
    gradeLabel: localizedLabel,
    tone: calc.tone,
  });

  const ai = await generateJson({
    systemSuffix: NEUTRAL_CARD_VOICE,
    userPrompt,
    schema: nameCompatibilityAiSchema,
    model: AI_MODELS.fast, // Haiku — 빠르고 저렴
    maxTokens: 500,
    locale: await getLocale(),
  });

  return {
    ...calc,
    label: localizedLabel,
    ...ai,
  };
}
