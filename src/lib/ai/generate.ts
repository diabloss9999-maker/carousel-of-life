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
import { getLocaleDirective, type AiLocale } from "@/lib/ai/locale-directive";

interface GenerateJsonOptions<TSchema extends z.ZodTypeAny> {
  schema: TSchema;
  userPrompt: string;
  model: string;
  maxTokens: number;
  systemSuffix?: string;
  /** 응답 언어 — 영어면 system 끝에 영어 출력 지시문이 자동 추가됨. */
  locale?: AiLocale | string;
}

export async function generateJson<TSchema extends z.ZodTypeAny>(
  opts: GenerateJsonOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const anthropic = getAnthropic();

  const localeDirective = getLocaleDirective(opts.locale);
  const systemText = (opts.systemSuffix ?? "") + localeDirective;

  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    ...(systemText
      ? {
          system: [
            {
              type: "text" as const,
              text: systemText,
              cache_control: { type: "ephemeral" as const },
            },
          ],
        }
      : {}),
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI 응답에서 텍스트 블록을 찾지 못했어.");
  }

  const json = extractJson(textBlock.text);
  return opts.schema.parse(json);
}

interface GenerateMarkdownOptions {
  userPrompt: string;
  model: string;
  maxTokens: number;
  systemSuffix?: string;
  /** 응답 언어 — 영어면 system 끝에 영어 출력 지시문이 자동 추가됨. */
  locale?: AiLocale | string;
}

export async function generateMarkdown(
  opts: GenerateMarkdownOptions,
): Promise<string> {
  const anthropic = getAnthropic();

  const localeDirective = getLocaleDirective(opts.locale);
  const systemText = (opts.systemSuffix ?? "") + localeDirective;

  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    ...(systemText
      ? {
          system: [
            {
              type: "text" as const,
              text: systemText,
              cache_control: { type: "ephemeral" as const },
            },
          ],
        }
      : {}),
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI 응답에서 텍스트 블록을 찾지 못했어.");
  }

  return textBlock.text.trim();
}
