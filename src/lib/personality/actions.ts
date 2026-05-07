"use server";

/**
 * 성격 유형 테스트 결과 저장 서버 액션.
 */
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { ROUTES } from "@/lib/constants";
import { calcPersonalityType, type Choice } from "./questions";

/**
 * 20개 답변을 받아 유형을 계산하고 profiles.mbti 에 저장.
 */
export async function savePersonalityResult(
  answers: Choice[],
): Promise<{ type: string }> {
  const { profile } = await requireProfile();

  if (answers.length !== 20) {
    throw new Error("답변은 정확히 20개여야 해요.");
  }

  const type = calcPersonalityType(answers);

  await db
    .update(profiles)
    .set({ mbti: type })
    .where(eq(profiles.userId, profile.userId));

  revalidatePath(ROUTES.personality, "page");
  revalidatePath(ROUTES.today, "page");

  return { type };
}
