/**
 * 꿈해몽 풀이 service.
 *
 * 사용자 꿈 내용 + 사주를 결합해 AI 가 해석 생성. DB 저장 X (스테이트리스).
 * 사용자가 원하면 화면에서 결과를 메모해 두면 됨.
 */
import "server-only";

import { generateJson } from "@/lib/ai/generate";
import { buildDreamReadingPrompt } from "@/lib/ai/prompts";
import {
  dreamReadingAiSchema,
  type DreamReadingAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import type { Profile } from "@/db/schema";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";

export type DreamMood = "bright" | "dark" | "weird" | "neutral";

export interface DreamReadingInput {
  profile: Profile;
  dreamContent: string;
  mood?: DreamMood;
  /** 풀이해줄 캐릭터 (동양 캐릭터 선호). */
  characterId?: "taoist" | "shaman" | "witch";
}

export interface DreamReadingResult extends DreamReadingAiOutput {
  characterId: "taoist" | "shaman" | "witch";
}

const DEFAULT_CHARACTER = "taoist" as const;

export async function generateDreamReading(
  input: DreamReadingInput,
): Promise<DreamReadingResult> {
  const characterId: "taoist" | "shaman" | "witch" =
    input.characterId ?? DEFAULT_CHARACTER;
  const voice = CHARACTER_CARD_VOICE[characterId];

  const userPrompt = buildDreamReadingPrompt({
    profile: input.profile,
    dreamContent: input.dreamContent,
    mood: input.mood ?? "neutral",
  });

  const data = await generateJson({
    systemSuffix: voice,
    userPrompt,
    schema: dreamReadingAiSchema,
    model: AI_MODELS.premium,
    maxTokens: 1500,
  });

  return { ...data, characterId };
}
