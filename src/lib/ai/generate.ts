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
 *
 * 단, extended thinking 이 기본 활성화된 일부 신모델(예: claude-sonnet-4-6)은
 * assistant prefill 을 허용하지 않는다 — API 가 400 으로 거부함:
 *   "This model does not support assistant message prefill."
 * 해당 모델에는 prefill 없이 호출하고 `extractJson` 으로 견고하게 파싱한다.
 */
const JSON_PREFILL = "{";

/** prefill 을 지원하지 않는 모델 이름 일부(부분 일치). */
const PREFILL_UNSUPPORTED_PATTERNS = ["sonnet-4-6", "opus-4-1"] as const;

function supportsAssistantPrefill(model: string): boolean {
  return !PREFILL_UNSUPPORTED_PATTERNS.some((p) => model.includes(p));
}

type TextLikeBlock = { type: string; text?: unknown };

function collectResponseText(content: readonly TextLikeBlock[]): string {
  return content
    .map((block) =>
      block.type === "text" && typeof block.text === "string"
        ? block.text
        : "",
    )
    .join("\n")
    .trim();
}

function describeContentBlocks(content: readonly TextLikeBlock[]): string {
  return content.map((block) => block.type).join(", ") || "empty";
}

function missingTextBlockError(opts: {
  content: readonly TextLikeBlock[];
  model: string;
  stopReason?: string | null;
}): Error {
  console.warn("[ai] response contained no text block", {
    model: opts.model,
    stopReason: opts.stopReason ?? "unknown",
    contentTypes: describeContentBlocks(opts.content),
  });

  return new Error("AI 응답이 비어있어요. 잠시 후 다시 시도해주세요.");
}

export async function generateJson<TSchema extends z.ZodTypeAny>(
  opts: GenerateJsonOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const anthropic = getAnthropic();

  const localeDirective = getLocaleDirective(opts.locale);
  const systemText = (opts.systemSuffix ?? "") + localeDirective;
  const usePrefill = supportsAssistantPrefill(opts.model);

  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    // stop_sequences 로 닫는 } 다음에 모델이 사족을 못 붙이게 막는 건
    // JSON 내부의 } 까지 잘릴 수 있어 주의. prefill 만 사용한다.
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
    messages: usePrefill
      ? [
          { role: "user", content: opts.userPrompt },
          // assistant prefill — JSON 강제
          { role: "assistant", content: JSON_PREFILL },
        ]
      : [
          // prefill 미지원 모델: 사용자 메시지 끝에 강한 JSON 출력 지시를 덧붙여서
          // 모델이 알아서 `{` 로 시작하도록 유도한다.
          {
            role: "user",
            content:
              opts.userPrompt +
              "\n\n지시: 위 요청에 대해 마크다운, 코드 펜스, 서두·맺음말 없이 **순수 JSON 객체 하나만** 출력해. 응답은 반드시 `{` 로 시작해서 `}` 로 끝나야 해.",
          },
        ],
  });

  const responseText = collectResponseText(response.content);
  if (!responseText) {
    throw missingTextBlockError({
      content: response.content,
      model: opts.model,
      stopReason: response.stop_reason,
    });
  }

  // prefill 사용 시 응답엔 `{` 가 빠져 있으므로 다시 붙여 완전한 JSON 으로 복원.
  // 미사용 시 응답이 이미 JSON 전체를 포함.
  const rawText = usePrefill ? JSON_PREFILL + responseText : responseText;

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

  const responseText = collectResponseText(response.content);
  if (!responseText) {
    throw missingTextBlockError({
      content: response.content,
      model: opts.model,
      stopReason: response.stop_reason,
    });
  }

  return responseText;
}
