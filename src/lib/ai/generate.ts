/**
 * AI JSON 응답 생성 헬퍼.
 *
 * - Anthropic Claude API 호출
 * - 응답에서 JSON 안전 추출 (assistant prefill 로 강제)
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

/**
 * Anthropic Claude 의 권장 패턴 — assistant 메시지를 `{` 로 prefill 하면
 * 모델이 그 뒤를 이어서 작성하므로 서두/맺음말 없이 순수 JSON 만 나온다.
 * 응답엔 prefill 한 `{` 가 빠져 있으므로 다시 붙여 파싱한다.
 */
const JSON_PREFILL = "{";

export async function generateJson<TSchema extends z.ZodTypeAny>(
  opts: GenerateJsonOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const anthropic = getAnthropic();

  const localeDirective = getLocaleDirective(opts.locale);
  const systemText = (opts.systemSuffix ?? "") + localeDirective;

  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    // stop_sequences 로 닫는 } 다음에 모델이 사족을 못 붙이게 막는 건
    // JSON 내부의 } 까지 잘릴 수 있어 위험. prefill 만 사용한다.
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
    messages: [
      { role: "user", content: opts.userPrompt },
      // assistant prefill — JSON 강제
      { role: "assistant", content: JSON_PREFILL },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI 응답에서 텍스트 블록을 찾지 못했어.");
  }

  // prefill 한 `{` 를 다시 붙여 완전한 JSON 으로 복원.
  const rawText = JSON_PREFILL + textBlock.text;

  try {
    const json = extractJson(rawText);
    return opts.schema.parse(json);
  } catch (e) {
    // 디버깅을 위해 응답의 일부와 stop_reason 을 에러 메시지에 포함.
    const stopReason = response.stop_reason ?? "unknown";
    const preview = rawText.slice(0, 200).replace(/\s+/g, " ");
    const baseMsg = e instanceof Error ? e.message : "JSON 파싱 실패";
    throw new Error(
      `${baseMsg} (stop=${stopReason}, preview="${preview}…")`,
    );
  }
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
