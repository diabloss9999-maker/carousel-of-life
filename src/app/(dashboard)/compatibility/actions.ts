"use server";

/**
 * 궁합 풀이 Server Action.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { createCompatibility } from "@/lib/compatibility/service";

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/i;

const partnerSchema = z.object({
  name: z.string().min(1, "상대방 이름을 알려줘.").max(40),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않아."),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "시각 형식이 올바르지 않아.")
    .optional()
    .or(z.literal("")),
  calendarSystem: z.enum(["solar", "lunar"]),
  gender: z.enum(["male", "female", "other"]),
  mbti: z
    .string()
    .trim()
    .toUpperCase()
    .regex(MBTI_PATTERN, "MBTI 네 글자를 정확히 적어줘.")
    .optional()
    .or(z.literal("")),
});

export interface CompatibilityActionState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
}

export async function submitCompatibilityAction(
  _prev: CompatibilityActionState,
  formData: FormData,
): Promise<CompatibilityActionState> {
  const parsed = partnerSchema.safeParse({
    name: formData.get("partnerName"),
    birthDate: formData.get("partnerBirthDate"),
    birthTime: formData.get("partnerBirthTime") ?? "",
    calendarSystem: formData.get("partnerCalendarSystem"),
    gender: formData.get("partnerGender"),
    mbti: formData.get("partnerMbti") ?? "",
  });

  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아.",
    };
  }

  const { profile } = await requireProfile();

  const result = await createCompatibility({
    profile,
    partner: {
      name: parsed.data.name,
      birthDate: parsed.data.birthDate,
      birthTime: parsed.data.birthTime || null,
      calendarSystem: parsed.data.calendarSystem,
      gender: parsed.data.gender,
      mbti: parsed.data.mbti?.toUpperCase() || null,
    },
  });

  if (result.ok) {
    revalidatePath("/compatibility");
    return { kind: "idle" };
  }

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: `오늘 무료 궁합은 ${result.max}회까지야. 프리미엄으로 무제한 풀어볼래?`,
    };
  }

  return { kind: "error", message: result.message };
}
