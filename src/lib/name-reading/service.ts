/**
 * 이름풀이 service.
 *
 * 한글 또는 한자 이름 + 사용자 사주 결합해 AI 가 의미·상생·운세 분석.
 * DB 저장 X (스테이트리스).
 */
import "server-only";

import { generateJson } from "@/lib/ai/generate";
import { buildNameReadingPrompt } from "@/lib/ai/prompts";
import {
  nameReadingAiSchema,
  type NameReadingAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import type { Profile } from "@/db/schema";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";

export interface NameReadingInput {
  profile: Profile;
  targetName: string;
  hanja?: string | null;
  /** 본인 이름인지 다른 사람 이름인지. */
  isOwnName: boolean;
  /** 풀이해줄 캐릭터 — 동양 캐릭터(현도·소율) 권장. */
  characterId?: "taoist" | "shaman";
}

export interface NameReadingResult extends NameReadingAiOutput {
  characterId: "taoist" | "shaman";
}

const DEFAULT_CHARACTER = "taoist" as const;

export async function generateNameReading(
  input: NameReadingInput,
): Promise<NameReadingResult> {
  const characterId: "taoist" | "shaman" =
    input.characterId ?? DEFAULT_CHARACTER;
  const voice = CHARACTER_CARD_VOICE[characterId];

  const userPrompt = buildNameReadingPrompt({
    profile: input.profile,
    targetName: input.targetName,
    hanja: input.hanja ?? null,
    isOwnName: input.isOwnName,
  });

  const data = await generateJson({
    systemSuffix: voice,
    userPrompt,
    schema: nameReadingAiSchema,
    model: AI_MODELS.premium,
    maxTokens: 1500,
  });

  return { ...data, characterId };
}
