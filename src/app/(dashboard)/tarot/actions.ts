"use server";

/**
 * 타로 카드 뽑기 Server Action.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { createSingleTarot } from "@/lib/tarot/service";

const drawSchema = z.object({
  question: z
    .string()
    .trim()
    .max(200, "질문이 너무 길어요. 200자 이내로 줄여주세요.")
    .optional()
    .or(z.literal("")),
});

export interface TarotDrawState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
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
      message: `오늘의 타로 한도(${result.max}회)를 모두 사용했어요. 프리미엄 구독을 하시면 한도 없이 받을 수 있어요.`,
    };
  }

  return {
    kind: "error",
    message: result.message,
  };
}
