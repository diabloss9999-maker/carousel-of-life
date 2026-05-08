"use server";

/**
 * 궁합 풀이 + 관계 허브 Server Actions.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { createCompatibility } from "@/lib/compatibility/service";
import {
  addPartner,
  deletePartner,
  getPartner,
  RELATIONSHIP_OPTIONS,
} from "@/lib/compatibility/partners";

const MBTI_PATTERN = /^[EI][NS][TF][JP]$/i;
const COMPATIBILITY_ROUTE = "/compatibility";

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

export const compatibilityIdleState: CompatibilityActionState = {
  kind: "idle",
};

/**
 * 새 궁합 풀이 + (선택적) 상대 저장.
 */
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
  const savePartner = formData.get("savePartner") === "on";
  const relationshipRaw = (formData.get("relationship") ?? "친구").toString();
  const relationship = (RELATIONSHIP_OPTIONS as readonly string[]).includes(
    relationshipRaw,
  )
    ? relationshipRaw
    : "친구";

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
    if (savePartner) {
      try {
        await addPartner(profile.userId, {
          name: parsed.data.name,
          relationship,
          birthDate: parsed.data.birthDate,
          calendarSystem: parsed.data.calendarSystem,
          gender: parsed.data.gender,
          mbti: parsed.data.mbti?.toUpperCase() || null,
        });
      } catch {
        // 동일 이름의 상대가 이미 저장돼 있으면 무시.
      }
    }
    revalidatePath(COMPATIBILITY_ROUTE);
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

const newPartnerSchema = z.object({
  name: z.string().min(1, "상대방 이름을 알려줘.").max(40),
  relationship: z.string().min(1).max(20),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않아."),
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

export interface SavePartnerActionState {
  kind: "idle" | "error" | "success";
  message?: string;
}

export const savePartnerIdleState: SavePartnerActionState = { kind: "idle" };

/**
 * 새 상대를 관계 허브에 저장.
 */
export async function savePartnerAction(
  _prev: SavePartnerActionState,
  formData: FormData,
): Promise<SavePartnerActionState> {
  const parsed = newPartnerSchema.safeParse({
    name: formData.get("name"),
    relationship: formData.get("relationship") ?? "친구",
    birthDate: formData.get("birthDate"),
    calendarSystem: formData.get("calendarSystem"),
    gender: formData.get("gender"),
    mbti: formData.get("mbti") ?? "",
  });

  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아.",
    };
  }

  const { profile } = await requireProfile();

  try {
    await addPartner(profile.userId, {
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      birthDate: parsed.data.birthDate,
      calendarSystem: parsed.data.calendarSystem,
      gender: parsed.data.gender,
      mbti: parsed.data.mbti?.toUpperCase() || null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isDuplicate = msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505");
    return {
      kind: "error",
      message: isDuplicate ? "이미 같은 이름의 상대가 저장돼 있어." : `저장 실패: ${msg}`,
    };
  }

  revalidatePath(COMPATIBILITY_ROUTE);
  return { kind: "success", message: "상대를 저장했어." };
}

/**
 * 저장된 상대 삭제.
 */
export async function deletePartnerAction(formData: FormData): Promise<void> {
  const id = formData.get("partnerId");
  if (typeof id !== "string" || id.length === 0) return;
  const { profile } = await requireProfile();
  await deletePartner(profile.userId, id);
  revalidatePath(COMPATIBILITY_ROUTE);
}

export interface CompatForPartnerState {
  kind: "idle" | "error";
  message?: string;
  quotaExceeded?: boolean;
}

export const compatForPartnerIdleState: CompatForPartnerState = {
  kind: "idle",
};

/**
 * 저장된 상대를 기준으로 오늘의 궁합 풀이를 생성한다.
 */
export async function compatForPartnerAction(
  _prev: CompatForPartnerState,
  formData: FormData,
): Promise<CompatForPartnerState> {
  const partnerId = formData.get("partnerId");
  if (typeof partnerId !== "string" || partnerId.length === 0) {
    return { kind: "error", message: "상대 정보를 찾지 못했어." };
  }

  const { profile } = await requireProfile();
  const partner = await getPartner(profile.userId, partnerId);
  if (!partner) {
    return { kind: "error", message: "저장된 상대를 찾지 못했어." };
  }

  const result = await createCompatibility({
    profile,
    partner: {
      name: partner.name,
      birthDate: partner.birthDate,
      birthTime: null,
      calendarSystem: partner.calendarSystem,
      gender: partner.gender,
      mbti: partner.mbti,
    },
  });

  if (result.ok) {
    revalidatePath(COMPATIBILITY_ROUTE);
    return { kind: "idle" };
  }

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: `오늘 무료 궁합은 ${result.max}회까지야.`,
    };
  }

  return { kind: "error", message: result.message };
}
