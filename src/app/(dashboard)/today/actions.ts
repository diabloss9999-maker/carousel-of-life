"use server";

/**
 * 오늘의 운세 — Server Action.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { getOrCreateDailyFortune } from "@/lib/fortunes/service";

const categorySchema = z.enum([
  "general",
  "love",
  "money",
  "career",
  "health",
  "study",
  "zodiac",
  "chinese_zodiac",
]);

export interface FortuneActionState {
  kind: "idle" | "error";
  message?: string;
  /** 한도 초과 여부 (결제 CTA 노출용). */
  quotaExceeded?: boolean;
}

export async function generateFortuneAction(
  _prev: FortuneActionState,
  formData: FormData,
): Promise<FortuneActionState> {
  const parsed = categorySchema.safeParse(formData.get("category"));
  if (!parsed.success) {
    return {
      kind: "error",
      message: "카테고리가 올바르지 않아요.",
    };
  }

  const { profile } = await requireProfile();

  const result = await getOrCreateDailyFortune({
    profile,
    category: parsed.data,
  });

  if (result.ok) {
    revalidatePath("/today");
    return { kind: "idle" };
  }

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: `오늘의 운세 한도(${result.max}회)를 모두 사용했어요. 프리미엄 구독을 하시면 한도 없이 받으실 수 있어요.`,
    };
  }

  return {
    kind: "error",
    message: result.message,
  };
}
