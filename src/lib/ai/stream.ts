/**
 * Anthropic Claude 스트리밍 응답 래퍼.
 *
 * - SSE 가 아닌 단순 text/plain 청크 스트림으로 클라이언트에 전달
 *   (UI 가 ReadableStream 으로 점진적으로 읽으면 됨)
 * - 스트림 종료 후 콜백을 통해 전체 텍스트와 사용량 메타데이터를 반환
 */
import "server-only";

import { getAnthropic } from "@/lib/ai/anthropic";

export interface StreamChatOptions {
  model: string;
  maxTokens: number;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  /** 청크가 끝난 후 호출. 전체 텍스트와 토큰 사용량을 받는다. */
  onComplete?: (result: {
    fullText: string;
    inputTokens: number;
    outputTokens: number;
  }) => void | Promise<void>;
}

/**
 * Anthropic 스트림을 ReadableStream<Uint8Array> 로 변환한다.
 *
 * Route Handler 에서 그대로 Response 의 body 로 사용.
 */
export function streamChat(opts: StreamChatOptions): ReadableStream<Uint8Array> {
  const anthropic = getAnthropic();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let fullText = "";
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        const stream = anthropic.messages.stream({
          model: opts.model,
          max_tokens: opts.maxTokens,
          system: opts.system,
          messages: opts.messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(chunk));
          } else if (event.type === "message_start") {
            inputTokens = event.message.usage?.input_tokens ?? 0;
          } else if (event.type === "message_delta") {
            outputTokens = event.usage?.output_tokens ?? outputTokens;
          }
        }

        controller.close();

        if (opts.onComplete) {
          await opts.onComplete({ fullText, inputTokens, outputTokens });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`\n\n[오류] ${message}`));
        controller.close();
      }
    },
  });
}
