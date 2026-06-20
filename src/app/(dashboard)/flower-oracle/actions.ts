"use server";

import { z } from "zod";

import { FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  generateFlowerOracle,
  type FlowerOracleResult,
} from "@/lib/flower-oracle/service";
import { requireProfile } from "@/lib/auth/get-user";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";

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
    return { kind: "error", message: "요청 형식을 확인해 주세요." };
  }

  const { profile } = await requireProfile();

  try {
    enforceAiRateLimit(profile.userId, "flowerOracle");
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `잠시만요. ${error.retryAfterSec}초 뒤에 다시 시도해 주세요.`,
      };
    }
    throw error;
  }

  const quota = await checkAndIncrementQuota({
    userId: profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
    amount: 2,
  });

  if (!quota.ok) {
    return {
      kind: "error",
      message: `오늘의 운세 이용 횟수(${quota.max}회)를 모두 사용했어요. 내일 다시 만나요.`,
    };
  }

  try {
    const excludeIds = parsed.data.excludeIds
      ? parsed.data.excludeIds.split(",").map((id) => id.trim()).filter(Boolean)
      : [];
    const result = await generateFlowerOracle({
      profile,
      mode: parsed.data.mode,
      excludeIds,
    });
    return { kind: "result", result };
  } catch (error) {
    console.error("[flowerOracleAction]", error);
    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "꽃을 뽑는 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
    };
  }
}
