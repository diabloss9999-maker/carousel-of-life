"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";

import { requireProfile } from "@/lib/auth/get-user";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";
import {
  generateNameReading,
  type NameReadingResult,
} from "@/lib/name-reading/service";

export type NameReadingActionState =
  | { kind: "idle" }
  | { kind: "result"; reading: NameReadingResult }
  | { kind: "error"; message: string };

const nameSchema = z.object({
  targetName: z
    .string()
    .min(1, "이름을 입력해주세요.")
    .max(20, "이름이 너무 길어요."),
  hanja: z.string().max(20).optional().or(z.literal("")),
  isOwnName: z.enum(["true", "false"]).default("true"),
});

export async function readNameAction(
  _prev: NameReadingActionState,
  formData: FormData,
): Promise<NameReadingActionState> {
  const tErr = await getTranslations("actionErrors");
  const parsed = nameSchema.safeParse({
    targetName: String(formData.get("targetName") ?? "").trim(),
    hanja: String(formData.get("hanja") ?? "").trim(),
    isOwnName: String(formData.get("isOwnName") ?? "true"),
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: tErr("validationFailed"),
    };
  }

  const { profile } = await requireProfile();

  try {
    enforceAiRateLimit(profile.userId, "nameReading");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: tErr("rateLimitedSeconds", { n: e.retryAfterSec }),
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
      message: tErr("fortuneQuotaExceeded", { n: quota.max }),
    };
  }

  try {
    const reading = await generateNameReading({
      profile,
      targetName: parsed.data.targetName,
      hanja: parsed.data.hanja || null,
      isOwnName: parsed.data.isOwnName === "true",
    });
    return { kind: "result", reading };
  } catch (e) {
    console.error("[readNameAction]", e);
    return {
      kind: "error",
      message: tErr("nameReadingGenericError"),
    };
  }
}
