"use server";

/**
 * 타로 카드 뽑기 Server Action.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import {
  createSingleTarot,
  createThreeCardTarot,
} from "@/lib/tarot/service";

const drawSchema = z.object({
  question: z
    .string()
    .trim()
    .max(100, "질문은 100자 이내로 짧게 부탁해.")
    .optional()
    .or(z.literal("")),
});

export interface TarotDrawState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
  premiumOnly?: boolean;
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
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.",
    };
  }

  const { profile } = await requireProfile();

  const result = await createSingleTarot({
    profile,
    question: parsed.data.question?.trim() || null,
  });

  if (result.ok) {
    revalidatePath("/tarot");
    return { kind: "idle" };
  }

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: `오늘의 타로 한도(${result.max}회)를 모두 사용했어. 프리미엄 구독을 하면 한도 없이 받을 수 있어.`,
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
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.",
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

  if (result.reason === "premium_only") {
    return {
      kind: "error",
      premiumOnly: true,
      message: "3장 스프레드는 프리미엄 멤버십에서 만나볼 수 있어.",
    };
  }

  return {
    kind: "error",
    message: result.ok === false && "message" in result ? result.message : "오류가 났어",
  };
}
