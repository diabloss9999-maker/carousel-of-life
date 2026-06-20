"use server";

/**
 * 프로필 기본 정보 수정 Server Action.
 * 이름·MBTI·출생지 등 사주 재계산이 필요 없는 필드만 허용.
 */
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { ROUTES } from "@/lib/constants";

export interface ProfileFormState {
  kind: "idle" | "success" | "error";
  message?: string;
}

const profileSchema = z.object({
  displayName: z.string().min(1, "이름을 입력해줘.").max(40, "이름이 너무 길어."),
  mbti: z
    .string()
    .max(4)
    .regex(/^[A-Za-z]{0,4}$/, "성격유형 형식이 올바르지 않아.")
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  birthPlace: z.string().max(80).optional(),
});

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { profile } = await requireProfile();

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    mbti: formData.get("mbti") || undefined,
    birthPlace: formData.get("birthPlace") || undefined,
  });

  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아.",
    };
  }

  await db
    .update(profiles)
    .set({
      displayName: parsed.data.displayName,
      mbti: parsed.data.mbti ?? null,
      birthPlace: parsed.data.birthPlace ?? null,
    })
    .where(eq(profiles.userId, profile.userId));

  revalidatePath(ROUTES.settings, "page");
  revalidatePath(ROUTES.appHome, "page");
  revalidatePath(ROUTES.today, "page");

  return { kind: "success", message: "정보가 업데이트됐어." };
}
