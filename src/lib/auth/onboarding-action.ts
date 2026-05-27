"use server";

/**
 * 온보딩 — 사용자 프로필 생성 Server Action.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ROUTES } from "@/lib/constants";
import { requireUser } from "@/lib/auth/get-user";

export interface OnboardingFormState {
  kind: "idle" | "error";
  message?: string;
}

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/i;

const onboardingSchema = z.object({
  displayName: z
    .string()
    .min(1, "이름을 입력해주세요.")
    .max(40, "이름이 너무 길어요."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않아요.")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
    }, "올바른 과거 날짜를 입력해주세요."),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "시각 형식이 올바르지 않아요.")
    .optional()
    .or(z.literal("")),
  calendarSystem: z.enum(["solar", "lunar"]),
  gender: z.enum(["male", "female", "other"]),
  mbti: z
    .string()
    .trim()
    .toUpperCase()
    .regex(MBTI_PATTERN, "MBTI 네 글자를 정확히 입력해주세요.")
    .optional()
    .or(z.literal("")),
  birthPlace: z.string().max(80).optional().or(z.literal("")),
});

export async function onboardingAction(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    birthDate: formData.get("birthDate"),
    birthTime: formData.get("birthTime") ?? "",
    calendarSystem: formData.get("calendarSystem"),
    gender: formData.get("gender"),
    mbti: formData.get("mbti") ?? "",
    birthPlace: formData.get("birthPlace") ?? "",
  });

  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.",
    };
  }

  const { displayName, birthDate, calendarSystem, gender } = parsed.data;
  const birthTime = parsed.data.birthTime || null;
  const mbti = parsed.data.mbti ? parsed.data.mbti.toUpperCase() : null;
  const birthPlace = parsed.data.birthPlace || null;

  // 친구 초대 기능 제거 — invitedBy 는 항상 null. (DB 컬럼은 유지 — 기존 데이터 보호)
  const invitedBy: string | null = null;

  try {
    await db
      .insert(profiles)
      .values({
        userId: user.id,
        displayName,
        birthDate,
        birthTime,
        calendarSystem,
        gender,
        mbti,
        birthPlace,
        invitedBy,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          displayName,
          birthDate,
          birthTime,
          calendarSystem,
          gender,
          mbti,
          birthPlace,
          // invitedBy 는 onConflict 에서 갱신 X — 한 번 가입한 사용자는 초대자 정보 고정.
        },
      });
  } catch (e) {
    return {
      kind: "error",
      message: `프로필 저장 중 오류가 났어요: ${e instanceof Error ? e.message : "알 수 없는 원인"}`,
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.chat);
}
