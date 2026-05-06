/**
 * 사주팔자 계산 — AI 위임 + DB 캐시.
 */
import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { buildUserContext } from "@/lib/ai/prompts";

const stemSchema = z.string().min(1).max(2);
const branchSchema = z.string().min(1).max(2);

const sajuPillarsSchema = z.object({
  year: z.object({ stem: stemSchema, branch: branchSchema }),
  month: z.object({ stem: stemSchema, branch: branchSchema }),
  day: z.object({ stem: stemSchema, branch: branchSchema }),
  hour: z.object({ stem: stemSchema, branch: branchSchema }).nullable(),
});

const fiveElementsSchema = z.object({
  wood: z.number().int().min(0).max(8),
  fire: z.number().int().min(0).max(8),
  earth: z.number().int().min(0).max(8),
  metal: z.number().int().min(0).max(8),
  water: z.number().int().min(0).max(8),
});

const sajuOutputSchema = z.object({
  pillars: sajuPillarsSchema,
  fiveElements: fiveElementsSchema,
});

export type SajuOutput = z.infer<typeof sajuOutputSchema>;

/**
 * AI 에 사주 계산을 요청.
 */
export async function calculateSaju(
  profile: Pick<
    Profile,
    | "birthDate"
    | "birthTime"
    | "calendarSystem"
    | "gender"
    | "displayName"
    | "mbti"
    | "birthPlace"
  >,
): Promise<SajuOutput> {
  const ctx = buildUserContext({ profile });

  const userPrompt = `[질문자 정보]
${ctx}

[지시]
질문자의 정보를 바탕으로 사주팔자(년주·월주·일주·시주)와 오행 분포를 계산해주세요.

규칙:
- 양력으로 입력된 경우 입춘(立春) 기준으로 년주를 결정합니다.
- 음력 입력은 양력으로 환산한 후 절기를 적용합니다.
- 태어난 시각이 없으면 시주(hour)는 null 로 두고 시지를 추정하지 않습니다.
- 천간(天干)과 지지(地支)는 한자 한 글자만 사용합니다.
  허용 천간: 甲乙丙丁戊己庚辛壬癸
  허용 지지: 子丑寅卯辰巳午未申酉戌亥
- 오행(wood, fire, earth, metal, water) 합은 8(시주 포함) 또는 6(시주 없음).

다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "pillars": {
    "year":  { "stem": "한자 1자", "branch": "한자 1자" },
    "month": { "stem": "한자 1자", "branch": "한자 1자" },
    "day":   { "stem": "한자 1자", "branch": "한자 1자" },
    "hour":  { "stem": "한자 1자", "branch": "한자 1자" } 또는 null
  },
  "fiveElements": {
    "wood": 정수, "fire": 정수, "earth": 정수, "metal": 정수, "water": 정수
  }
}`;

  return generateJson({
    schema: sajuOutputSchema,
    userPrompt,
    model: AI_MODELS.fast,
    maxTokens: AI_LIMITS.sajuMaxTokens,
    systemSuffix:
      "사주 계산 전용 모드입니다. 산문이나 풀이는 일절 덧붙이지 말고 JSON 만 응답합니다.",
  });
}

/**
 * profile 에 사주가 캐시되어 있으면 그대로 반환,
 * 없으면 AI 호출 + DB 저장 후 반환.
 */
export async function ensureSajuCalculated(profile: Profile): Promise<Profile> {
  if (profile.sajuPillars && profile.fiveElements) {
    return profile;
  }

  const saju = await calculateSaju(profile);

  const [updated] = await db
    .update(profiles)
    .set({
      sajuPillars: saju.pillars,
      fiveElements: saju.fiveElements,
    })
    .where(eq(profiles.userId, profile.userId))
    .returning();

  return (
    updated ?? {
      ...profile,
      sajuPillars: saju.pillars,
      fiveElements: saju.fiveElements,
    }
  );
}
