import "server-only";

import { getLocale } from "next-intl/server";

import { generateJson } from "@/lib/ai/generate";
import { NEUTRAL_CARD_VOICE } from "@/lib/ai/character-voice";
import {
  flowerOracleAiSchema,
  type FlowerOracleAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import type { Profile } from "@/db/schema";
import {
  drawDaily,
  drawRandom,
  flowerById,
} from "@/lib/flower-oracle/algorithm";
import { type FlowerCard } from "@/lib/flower-oracle/flowers";

export type FlowerOracleMode = "daily" | "free";

export interface FlowerOracleInput {
  profile: Profile;
  mode: FlowerOracleMode;
  excludeIds?: string[];
  forceFlowerId?: string;
}

export interface FlowerOracleResult extends FlowerOracleAiOutput {
  flower: FlowerCard;
  mode: FlowerOracleMode;
}

export async function generateFlowerOracle(
  input: FlowerOracleInput,
): Promise<FlowerOracleResult> {
  let flower: FlowerCard;
  if (input.forceFlowerId) {
    const forced = flowerById(input.forceFlowerId);
    if (!forced) throw new Error(`존재하지 않는 꽃 ID: ${input.forceFlowerId}`);
    flower = forced;
  } else if (input.mode === "daily") {
    const fiveElements =
      (input.profile.fiveElements as Record<string, number> | null) ?? null;
    flower = drawDaily({ userId: input.profile.userId, fiveElements });
  } else {
    flower = drawRandom(input.excludeIds ?? []);
  }

  const ai = await generateJson({
    systemSuffix: NEUTRAL_CARD_VOICE,
    userPrompt: buildFlowerPrompt(input.profile, flower, input.mode),
    schema: flowerOracleAiSchema,
    model: AI_MODELS.fast,
    maxTokens: 600,
    locale: await getLocale(),
  });

  return {
    ...ai,
    flower,
    mode: input.mode,
  };
}

function buildFlowerPrompt(
  profile: Profile,
  flower: FlowerCard,
  mode: FlowerOracleMode,
): string {
  const profileLines = [
    profile.displayName ? `이름: ${profile.displayName}` : null,
    `생년월일: ${profile.birthDate}`,
    profile.birthTime ? `태어난 시간: ${profile.birthTime}` : "태어난 시간: 모름",
    `달력: ${profile.calendarSystem === "lunar" ? "음력" : "양력"}`,
    profile.mbti ? `MBTI: ${profile.mbti}` : null,
  ].filter(Boolean);

  return `[사용자 정보]
${profileLines.join("\n")}

[선택된 꽃]
이름: ${flower.koreanName}
학명: ${flower.scientificName}
꽃말: ${flower.meaning}
키워드: ${flower.keywords.join(", ")}
계절: ${flower.season}
모드: ${mode === "daily" ? "오늘의 꽃" : "자유 뽑기"}

[작성 지침]
너는 꽃점 결과를 현실적이고 따뜻한 한국어로 정리한다.
꽃말을 과장하지 말고, 사용자의 오늘 감정과 선택에 연결해서 짧고 선명하게 말한다.
아이돌, 멤버, 팬서비스 콘셉트는 언급하지 않는다.

반드시 아래 JSON 형식만 반환한다.
{
  "headline": "꽃이 건네는 핵심 메시지. 50자 이내.",
  "reading": "꽃말과 키워드를 바탕으로 한 오늘의 해석. 4-6문장.",
  "todayAction": "오늘 바로 해볼 수 있는 작은 행동 1가지. 1-2문장."
}`;
}
