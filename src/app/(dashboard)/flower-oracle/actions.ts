"use server";

import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  generateFlowerOracle,
  type FlowerOracleResult,
} from "@/lib/flower-oracle/service";

export type FlowerOracleActionState =
  | { kind: "idle" }
  | { kind: "result"; result: FlowerOracleResult }
  | { kind: "error"; message: string };

const schema = z.object({
  mode: z.enum(["daily", "free"]).default("daily"),
  excludeIds: z.string().optional(),
});

export async function flowerOracleAction(
  _prev: FlowerOracleActionState,
  formData: FormData,
): Promise<FlowerOracleActionState> {
  const parsed = schema.safeParse({
    mode: String(formData.get("mode") ?? "daily"),
    excludeIds: String(formData.get("excludeIds") ?? ""),
  });
  if (!parsed.success) {
    return { kind: "error", message: "요청 형식이 올바르지 않아요." };
  }

  const { profile } = await requireProfile();

  // 1) Rate limit
  try {
    enforceAiRateLimit(profile.userId, "flowerOracle");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `잠깐만, ${e.retryAfterSec}초 뒤에 다시 시도해줘.`,
      };
    }
    throw e;
  }

  // 2) 일일 한도 — 운세 quota 공유
  const quota = await checkAndIncrementQuota({
    userId: profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
  });
  if (!quota.ok) {
    return {
      kind: "error",
      message: `오늘 풀이 한도(${quota.max}회)를 모두 사용했어. 내일 다시 만나.`,
    };
  }

  // 3) 알고리즘 + AI
  try {
    const excludeIds = parsed.data.excludeIds
      ? parsed.data.excludeIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const result = await generateFlowerOracle({
      profile,
      mode: parsed.data.mode,
      excludeIds,
    });
    return { kind: "result", result };
  } catch (e) {
    console.error("[flowerOracleAction]", e);
    return {
      kind: "error",
      message:
        e instanceof Error
          ? e.message
          : "꽃을 읽는 중 어긋났어. 잠시 후 다시 시도해줘.",
    };
  }
}
