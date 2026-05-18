"use server";

/**
 * 타로 카드 뽑기 Server Action.
 */
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { enforceAiRateLimit, RateLimitedError } from "@/lib/rate-limit/in-memory";
import { createLenormandReading } from "@/lib/lenormand/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import {
  createRuneReading,
  type RuneSpreadType,
} from "@/lib/runes/service";
import {
  createSingleTarot,
  createThreeCardTarot,
} from "@/lib/tarot/service";

const drawSchema = z.object({
  question: z
    .string()
    .trim()
    .max(100, "QUESTION_TOO_LONG")
    .optional()
    .or(z.literal("")),
});

export interface TarotDrawState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
  premiumOnly?: boolean;
}

/** zod 에러 메시지 토큰 → locale 별 메시지. */
async function zodMessage(code: string | undefined): Promise<string> {
  const tErr = await getTranslations("actionErrors");
  if (code === "QUESTION_TOO_LONG") return tErr("questionTooLong");
  return tErr("validationFailed");
}

export async function drawSingleTarotAction(
  _prev: TarotDrawState,
  formData: FormData,
): Promise<TarotDrawState> {
  const parsed = drawSchema.safeParse({
    question: formData.get("question") ?? "",
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: await zodMessage(parsed.error.issues[0]?.message),
    };
  }

  const { profile } = await requireProfile();

  try {
    enforceAiRateLimit(profile.userId, "tarot");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return { kind: "error", message: `잠시 후 다시 시도해줘. (${e.retryAfterSec}s)` };
    }
    throw e;
  }

  const result = await createSingleTarot({
    profile,
    question: parsed.data.question?.trim() || null,
  });

  if (result.ok) {
    revalidatePath("/tarot");
    return { kind: "idle" };
  }

  const tErr = await getTranslations("actionErrors");

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: tErr("tarotQuotaUpgradeFull", { n: result.max }),
    };
  }

  if (result.reason === "premium_only") {
    return { kind: "error", premiumOnly: true };
  }

  return {
    kind: "error",
    message: result.message,
  };
}

export async function drawThreeTarotAction(
  _prev: TarotDrawState,
  formData: FormData,
): Promise<TarotDrawState> {
  const parsed = drawSchema.safeParse({
    question: formData.get("question") ?? "",
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: await zodMessage(parsed.error.issues[0]?.message),
    };
  }

  const { profile } = await requireProfile();

  const result = await createThreeCardTarot({
    profile,
    question: parsed.data.question?.trim() || null,
  });

  if (result.ok) {
    revalidatePath("/tarot");
    return { kind: "idle" };
  }

  const tErr = await getTranslations("actionErrors");

  if (result.reason === "premium_only") {
    return {
      kind: "error",
      premiumOnly: true,
      message: tErr("tarotThreePremium"),
    };
  }

  return {
    kind: "error",
    message: result.ok === false && "message" in result ? result.message : tErr("tarotGenericError"),
  };
}

// =============================================================================
// 르노르망 카드 점술
// =============================================================================

const lenormandSchema = z.object({
  spread: z
    .enum(["single", "three", "nine", "grand_tableau"])
    .default("single"),
  question: z
    .string()
    .trim()
    .max(100, "QUESTION_TOO_LONG")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female"]).optional(),
});

export interface LenormandDrawState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
  premiumOnly?: boolean;
}

export async function drawLenormandAction(
  _prev: LenormandDrawState,
  formData: FormData,
): Promise<LenormandDrawState> {
  const rawGender = formData.get("gender");
  const parsed = lenormandSchema.safeParse({
    spread: formData.get("spread") ?? "single",
    question: formData.get("question") ?? "",
    gender:
      typeof rawGender === "string" && rawGender.length > 0
        ? rawGender
        : undefined,
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: await zodMessage(parsed.error.issues[0]?.message),
    };
  }

  const tErr = await getTranslations("actionErrors");

  // 그랑 타블로는 gender 가 필수.
  if (parsed.data.spread === "grand_tableau" && !parsed.data.gender) {
    return {
      kind: "error",
      message: tErr("lenormandGrandTableauGender"),
    };
  }

  try {
    const { profile } = await requireProfile();
    const isSubscribed = await hasActiveSubscription(profile.userId);

    const result = await createLenormandReading({
      profile,
      spreadType: parsed.data.spread,
      question: parsed.data.question?.trim() || null,
      isSubscribed,
      gender: parsed.data.gender,
    });

    if (result.ok) {
      revalidatePath("/tarot");
      return { kind: "idle" };
    }
    if (result.reason === "quota_exceeded") {
      return {
        kind: "error",
        quotaExceeded: true,
        message: tErr("lenormandQuotaUpgradeFull", { n: result.max }),
      };
    }
    if (result.reason === "premium_only") {
      return {
        kind: "error",
        premiumOnly: true,
        message: tErr("lenormandPremiumSpread"),
      };
    }
    if (result.reason === "invalid_input") {
      return { kind: "error", message: result.message };
    }
    return { kind: "error", message: result.message };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : tErr("lenormandGenericError"),
    };
  }
}

// =============================================================================
// 엘더 푸타르크 룬 점술
// =============================================================================

const runeSchema = z.object({
  spread: z.enum(["single", "three", "five", "nine"]).default("single"),
  question: z
    .string()
    .trim()
    .max(100, "QUESTION_TOO_LONG")
    .optional()
    .or(z.literal("")),
  reversedEnabled: z.boolean().default(true),
});

export interface RuneDrawState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
  premiumOnly?: boolean;
}

export async function drawRuneAction(
  _prev: RuneDrawState,
  formData: FormData,
): Promise<RuneDrawState> {
  const parsed = runeSchema.safeParse({
    spread: formData.get("spread") ?? "single",
    question: formData.get("question") ?? "",
    reversedEnabled: formData.get("reversedEnabled") === "on",
  });
  if (!parsed.success) {
    return {
      kind: "error",
      message: await zodMessage(parsed.error.issues[0]?.message),
    };
  }

  const tErr = await getTranslations("actionErrors");

  try {
    const { profile } = await requireProfile();
    const isSubscribed = await hasActiveSubscription(profile.userId);

    const result = await createRuneReading({
      profile,
      spreadType: parsed.data.spread as RuneSpreadType,
      question: parsed.data.question?.trim() || null,
      isSubscribed,
      reversedEnabled: parsed.data.reversedEnabled,
    });

    if (result.ok) {
      revalidatePath("/tarot");
      return { kind: "idle" };
    }
    if (result.reason === "quota_exceeded") {
      return {
        kind: "error",
        quotaExceeded: true,
        message: tErr("runeQuotaUpgradeFull", { n: result.max }),
      };
    }
    if (result.reason === "premium_only") {
      return {
        kind: "error",
        premiumOnly: true,
        message: tErr("runePremiumSpread"),
      };
    }
    return { kind: "error", message: result.message };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : tErr("runeGenericError"),
    };
  }
}
