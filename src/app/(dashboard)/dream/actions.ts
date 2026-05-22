"use server";

/**
 * 꿈해몽 Server Action.
 *
 * 사용자 꿈 내용 + 분위기 → AI 가 사주와 결합해 해석.
 * 분당 rate limit + 일일 운세 quota 차감.
 */
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  generateDreamReading,
  type DreamMood,
  type DreamReadingResult,
} from "@/lib/dream/service";

export type DreamActionState =
  | { kind: "idle" }
  | { kind: "result"; reading: DreamReadingResult }
  | { kind: "error"; message: string };

const dreamSchema = z.object({
  dreamContent: z
    .string()
    .min(10, "꿈 내용을 10자 이상 적어주세요.")
    .max(500, "꿈은 500자 이내로 간결하게 적어주세요."),
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
      message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  }

  const { profile } = await requireProfile();

  // 분당 burst 차단 (분당 6회)
  try {
    enforceAiRateLimit(profile.userId, "dream");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `너무 빠르게 호출하고 있어. ${e.retryAfterSec}초 뒤에 다시 시도해줘.`,
      };
    }
    throw e;
  }

  // 일일 운세 카운터에 묶음 (꿈해몽도 fortune 카운터)
  const quota = await checkAndIncrementQuota({
    userId: profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
  });
  if (!quota.ok) {
    return {
      kind: "error",
      message: `오늘의 운세 한도(${quota.max}회)를 모두 사용했어. 내일 다시 만나.`,
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
      message: "꿈을 풀이하는 중 어긋났어. 잠시 후 다시 시도해줘.",
    };
  }
}
