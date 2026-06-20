/**
 * 손금 풀이 서비스.
 *
 * Claude Vision API 로 손바닥 사진을 분석한다.
 *
 * 프라이버시 원칙:
 * - 이미지는 DB·storage 에 저장하지 않는다.
 * - 요청 처리 후 base64 문자열은 GC 로 즉시 회수.
 * - 결과 텍스트만 caller 가 원하면 저장 가능 (이미지 없이).
 *
 * 면책:
 * - 의학·심리 진단 아님. 재미용 풀이.
 * - 결과는 정통 손금학과 다를 수 있음.
 */
import "server-only";

import { getLocale } from "next-intl/server";
import { getAnthropic } from "@/lib/ai/anthropic";
import { getLocaleDirective } from "@/lib/ai/locale-directive";
import { AI_MODELS } from "@/lib/constants";

export interface PalmReadingInput {
  /** base64 인코딩된 이미지 (prefix 없이 순수 페이로드). */
  imageBase64: string;
  /** 이미지 MIME 타입. 보통 image/jpeg. */
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  /** 사용자가 궁금한 점 (선택). */
  question?: string;
}

export interface PalmReadingResult {
  interpretation: string;
  tokensUsed: { input: number; output: number };
}

/** 손금 풀이 시스템 프롬프트 — 중립 톤 + 손금 가이드 + 면책. */
function buildPalmSystemPrompt(): string {
  return `[손금 풀이 가이드]
사용자가 손바닥 사진을 보냈어. 너는 보이는 손금의 형태를 차분하고 실용적인 언어로 읽는다.
주요 선:
- 생명선 (엄지 둘레의 곡선) — 활력·체력·생기의 기운
- 두뇌선 (손바닥 중앙을 가로지르는 선) — 사고방식·결정의 패턴
- 감정선 (손바닥 위쪽 가로선) — 감정의 깊이·관계의 결
- 운명선 (손목에서 중지 쪽으로 올라가는 선, 있는 경우) — 운명의 굵기

읽기 원칙:
1. 사진에서 보이는 선들의 굵기·길이·끊김·교차 를 관찰해 한국어로 풀이.
2. 정통 손금학을 그대로 옮기지 말고 차분하고 실용적인 한국어로 재해석.
3. 사용자가 질문을 했다면 그 질문 맥락 안에서 손금을 연결.
4. 부정적 판정 (예: "단명") 절대 금지. 어둡더라도 "지켜야 할 결" 같이 부드럽게.
5. 외모·인종·나이·성별 등 사진에서 추론 가능한 신체 특징 절대 언급 금지.
6. 사진이 손바닥이 아니거나 흐릿하면 "선이 잘 보이지 않아요"처럼 중립적으로 거절하고 다시 찍어달라 요청.

[면책 — 마지막 줄에 반드시 포함]
"AI가 읽은 한 줄 풀이일 뿐, 의학·심리 진단은 아니에요. 재미로 봐주세요." 같은 식으로 마지막에 한 줄.

[분량]
6~10 문장. 너무 길지 않게.

[말투]
중립적이고 차분한 존댓말. 특정 멤버 이름, 멤버 말투, 배경 설정을 드러내지 마.
마크다운·이모지 금지.`;
}

export async function readPalm(
  input: PalmReadingInput,
): Promise<PalmReadingResult> {
  const client = getAnthropic();
  const locale = await getLocale();
  const systemPrompt = buildPalmSystemPrompt() + getLocaleDirective(locale);

  const userText = input.question?.trim()
    ? `이 손금을 봐줘. 특히 궁금한 건: ${input.question.trim()}`
    : `이 손금을 봐줘.`;

  const response = await client.messages.create({
    model: AI_MODELS.premium,
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.mediaType,
              data: input.imageBase64,
            },
          },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const interpretation =
    textBlock && textBlock.type === "text" ? textBlock.text : "";

  if (!interpretation.trim()) {
    throw new Error("AI 응답이 비어있어요. 다시 시도해주세요.");
  }

  return {
    interpretation,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
