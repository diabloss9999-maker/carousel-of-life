/**
 * AI JSON 응답 생성 헬퍼.
 *
 * - Anthropic Claude API 호출
 * - 응답에서 JSON 안전 추출
 * - zod 스키마로 검증
 *
 * 모든 AI 호출은 이 함수를 거친다.
 */
import "server-only";

import type { z } from "zod";

import { getAnthropic } from "@/lib/ai/anthropic";
import { extractJson } from "@/lib/ai/extract-json";
import { MYSTIC_PERSONA } from "@/lib/ai/personas";

interface GenerateJsonOptions<TSchema extends z.ZodTypeAny> {
  /** zod 스키마 — 응답 검증·타입 추론에 사용. */
  schema: TSchema;
  /** 사용자 프롬프트 (시스템 프롬프트와 분리). */
  userPrompt: string;
  /** 모델 ID. constants.AI_MODELS 에서 선택. */
  model: string;
  /** 응답 최대 토큰. */
  maxTokens: number;
  /**
   * 시스템 프롬프트 추가 부분.
   * `MYSTIC_PERSONA` 뒤에 붙인다.
   */
  systemSuffix?: string;
}

/**
 * 진지한 주술사 페르소나로 JSON 응답을 생성한다.
 *
 * @throws AI 응답이 JSON 형식이 아니거나 schema 검증 실패 시.
 */
export async function generateJson<TSchema extends z.ZodTypeAny>(
  opts: GenerateJsonOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const anthropic = getAnthropic();

  const system = opts.systemSuffix
    ? `${MYSTIC_PERSONA}\n\n${opts.systemSuffix}`
    : MYSTIC_PERSONA;

  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    system,
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI 응답에서 텍스트 블록을 찾지 못하였노라.");
  }

  const json = extractJson(textBlock.text);
  return opts.schema.parse(json);
}
