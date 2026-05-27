"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth/get-user";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  generateNameCompatibility,
  type NameCompatibilityOutput,
} from "@/lib/name-compatibility/service";
import {
  NAME_COMPATIBILITY_NAME_MESSAGE,
  NAME_COMPATIBILITY_NAME_PATTERN,
} from "@/lib/name-compatibility/algorithm";

export type NameCompatibilityActionState =
  | { kind: "idle" }
  | { kind: "result"; result: NameCompatibilityOutput }
  | { kind: "error"; message: string };

const schema = z.object({
  nameA: z
    .string()
    .regex(NAME_COMPATIBILITY_NAME_PATTERN, NAME_COMPATIBILITY_NAME_MESSAGE),
  nameB: z
    .string()
    .regex(NAME_COMPATIBILITY_NAME_PATTERN, NAME_COMPATIBILITY_NAME_MESSAGE),
});

export async function nameCompatibilityAction(
  _prev: NameCompatibilityActionState,
  formData: FormData,
): Promise<NameCompatibilityActionState> {
  const parsed = schema.safeParse({
    nameA: String(formData.get("nameA") ?? "").trim(),
    nameB: String(formData.get("nameB") ?? "").trim(),
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  }

  const user = await requireUser();

  // 1) Rate limit — 동일 사용자 빠른 연타 차단
  try {
    enforceAiRateLimit(user.id, "nameCompatibility");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `잠깐만, ${e.retryAfterSec}초 뒤에 다시 시도해줘.`,
      };
    }
    throw e;
  }

  // 2) 일일 한도 — 운세와 같은 quota 사용 (가벼운 풀이라 충분)
  const quota = await checkAndIncrementQuota({
    userId: user.id,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
  });
  if (!quota.ok) {
    return {
      kind: "error",
      message: `오늘 풀이 한도(${quota.max}회)를 모두 사용했어. 내일 다시 만나.`,
    };
  }

  // 3) 알고리즘 + AI 해설
  try {
    const result = await generateNameCompatibility({
      nameA: parsed.data.nameA,
      nameB: parsed.data.nameB,
    });
    return { kind: "result", result };
  } catch (e) {
    console.error("[nameCompatibilityAction]", e);
    return {
      kind: "error",
      message:
        e instanceof Error
          ? e.message
          : "궁합을 짚는 중 어긋났어. 잠시 후 다시 시도해줘.",
    };
  }
}
