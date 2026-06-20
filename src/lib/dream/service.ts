import "server-only";

import { getLocale } from "next-intl/server";

import { generateJson } from "@/lib/ai/generate";
import { NEUTRAL_CARD_VOICE } from "@/lib/ai/character-voice";
import {
  dreamReadingAiSchema,
  type DreamReadingAiOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import type { Profile } from "@/db/schema";

export type DreamMood = "bright" | "dark" | "weird" | "neutral";

export interface DreamReadingInput {
  profile: Profile;
  dreamContent: string;
  mood?: DreamMood;
}

export type DreamReadingResult = DreamReadingAiOutput;

export async function generateDreamReading(
  input: DreamReadingInput,
): Promise<DreamReadingResult> {
  const data = await generateJson({
    systemSuffix: NEUTRAL_CARD_VOICE,
    userPrompt: buildCleanDreamReadingPrompt(input),
    schema: dreamReadingAiSchema,
    model: AI_MODELS.premium,
    maxTokens: 1500,
    locale: await getLocale(),
  });

  return data;
}

function buildCleanDreamReadingPrompt(input: DreamReadingInput): string {
  const profile = input.profile;
  const profileLines = [
    profile.displayName ? `이름: ${profile.displayName}` : null,
    `생년월일: ${profile.birthDate}`,
    profile.birthTime ? `태어난 시간: ${profile.birthTime}` : "태어난 시간: 모름",
    `달력: ${profile.calendarSystem === "lunar" ? "음력" : "양력"}`,
    `성별: ${genderLabel(profile.gender)}`,
    profile.mbti ? `MBTI: ${profile.mbti}` : null,
    profile.birthPlace ? `출생지: ${profile.birthPlace}` : null,
  ].filter(Boolean);

  return `[질문자 정보]
${profileLines.join("\n")}

[꿈 내용]
${input.dreamContent}

[꿈의 분위기]
${moodLabel(input.mood ?? "neutral")}

[지시]
너는 꿈해몽을 현실적인 언어로 풀어주는 해석가다.
민간 꿈해몽의 상징, 질문자의 현재 감정, 생년월일에서 읽을 수 있는 개인 리듬을 함께 참고하되 전문용어를 쓰지 말고 쉽게 말한다.
절대 무서운 단정이나 불안 조장을 하지 말고, 꿈이 주는 신호를 "오늘 어떻게 정리하면 좋은지"로 연결한다.
아이돌, 멤버, 팬서비스 컨셉은 언급하지 않는다.

해석 가이드:
1. 꿈에서 핵심 상징 1~2개를 뽑는다.
2. 그 상징이 감정, 관계, 선택, 컨디션 중 어디와 연결되는지 설명한다.
3. 길몽/주의/경고/보통 중 하나로 분류한다.
4. 오늘 또는 이번 주에 해볼 만한 구체적인 행동 조언을 준다.
5. 모든 응답은 한국어로 쓴다.

반드시 아래 JSON 형식만 반환한다.
{
  "summary": "한 줄 요약 (40자 이내)",
  "fortune": "good" | "caution" | "bad" | "neutral",
  "meaning": "꿈의 상징과 감정 해석 (4-6문장)",
  "sajuConnection": "질문자의 개인 리듬과 꿈의 연결 (3-5문장, 전문용어 없이)",
  "advice": "오늘 또는 이번 주의 행동 조언 (2-3문장)"
}`;
}

function moodLabel(mood: DreamMood): string {
  switch (mood) {
    case "bright":
      return "밝고 편안한 분위기";
    case "dark":
      return "어둡고 무거운 분위기";
    case "weird":
      return "이상하고 비현실적인 분위기";
    default:
      return "분위기를 잘 모르겠음";
  }
}

function genderLabel(gender: string): string {
  if (gender === "male") return "남성";
  if (gender === "female") return "여성";
  return "기타";
}
