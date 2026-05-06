/**
 * Anthropic Claude SDK 인스턴스.
 *
 * - 서버 전용. 클라이언트 컴포넌트에서 import 금지.
 * - 싱글톤으로 재사용해 connection 풀을 안정화한다.
 */
import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { serverEnv } from "@/lib/env";

let cached: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (cached) return cached;

  const apiKey = serverEnv.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요.",
    );
  }

  cached = new Anthropic({ apiKey });
  return cached;
}
