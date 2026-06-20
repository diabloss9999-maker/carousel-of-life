"use server";

import { z } from "zod";

import { FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  generateDreamReading,
  type DreamMood,
  type DreamReadingResult,
} from "@/lib/dream/service";
import { requireProfile } from "@/lib/auth/get-user";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";

export type DreamActionState =
  | { kind: "idle" }
  | { kind: "result"; reading: DreamReadingResult }
  | { kind: "error"; message: string };

const dreamSchema = z.object({
  dreamContent: z
    .string()
    .min(10, "꿈 내용을 10자 이상 적어 주세요.")
    .max(500, "꿈 내용은 500자 이내로 적어 주세요."),
  mood: z.enum(["bright", "dark", "weird", "neutral"]).default("neutral"),
});

export async function readDreamAction(
  _prev: DreamActionState,
  formData: FormData,
): Promise<DreamActionState> {
  const parsed = dreamSchema.safeParse({
    dreamContent: String(formData.get("dreamContent") ?? "").trim(),
    mood: String(formData.get("mood") ?? "neutral"),
  });

  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.",
    };
  }

  const { profile } = await requireProfile();

  try {
    enforceAiRateLimit(profile.userId, "dream");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `너무 빠르게 요청하고 있어요. ${e.retryAfterSec}초 뒤에 다시 시도해 주세요.`,
      };
    }
    throw e;
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
    const reading = await generateDreamReading({
      profile,
      dreamContent: parsed.data.dreamContent,
      mood: parsed.data.mood as DreamMood,
    });
    return { kind: "result", reading };
  } catch (e) {
    console.error("[readDreamAction]", e);
    return {
      kind: "error",
      message: "꿈을 해석하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
