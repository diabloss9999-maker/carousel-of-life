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
import { generateJson } from "@/lib/ai/generate";
import { buildTwoPersonCompatPrompt } from "@/lib/ai/prompts";
import {
  compatibilityAiSchema,
  type CompatibilityAiOutput,
} from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";

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
  try {
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

  let profile, partner;
  try {
    const profileData = await requireProfile();
    profile = profileData.profile;
    partner = await getPartner(profile.userId, partnerId);
  } catch (e) {
    return { kind: "error", message: "인증 오류: " + (e instanceof Error ? e.message : String(e)) };
  }

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

/**
 * 타인 간 궁합 — 두 사람(A, B) 입력 후 AI 풀이.
 * DB에 저장하지 않고 결과만 상태로 반환 (즉석 분석).
 */
const twoPersonSchema = z.object({
  aName: z.string().min(1, "첫 번째 사람의 이름을 알려줘.").max(40),
  aBirthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "첫 번째 사람의 생년월일 형식이 올바르지 않아."),
  aCalendarSystem: z.enum(["solar", "lunar"]),
  aGender: z.enum(["male", "female", "other"]),
  aMbti: z
    .string()
    .trim()
    .toUpperCase()
    .regex(MBTI_PATTERN, "첫 번째 사람의 MBTI 네 글자를 정확히 적어줘.")
    .optional()
    .or(z.literal("")),
  bName: z.string().min(1, "두 번째 사람의 이름을 알려줘.").max(40),
  bBirthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "두 번째 사람의 생년월일 형식이 올바르지 않아."),
  bCalendarSystem: z.enum(["solar", "lunar"]),
  bGender: z.enum(["male", "female", "other"]),
  bMbti: z
    .string()
    .trim()
    .toUpperCase()
    .regex(MBTI_PATTERN, "두 번째 사람의 MBTI 네 글자를 정확히 적어줘.")
    .optional()
    .or(z.literal("")),
});

export interface TwoPersonCompatState {
  kind: "idle" | "error" | "success";
  message?: string;
  result?: {
    aName: string;
    bName: string;
    aBirthDate: string;
    bBirthDate: string;
    output: CompatibilityAiOutput;
  };
}

export const twoPersonCompatIdleState: TwoPersonCompatState = { kind: "idle" };

export async function twoPersonCompatAction(
  _prev: TwoPersonCompatState,
  formData: FormData,
): Promise<TwoPersonCompatState> {
  const parsed = twoPersonSchema.safeParse({
    aName: formData.get("aName"),
    aBirthDate: formData.get("aBirthDate"),
    aCalendarSystem: formData.get("aCalendarSystem"),
    aGender: formData.get("aGender"),
    aMbti: formData.get("aMbti") ?? "",
    bName: formData.get("bName"),
    bBirthDate: formData.get("bBirthDate"),
    bCalendarSystem: formData.get("bCalendarSystem"),
    bGender: formData.get("bGender"),
    bMbti: formData.get("bMbti") ?? "",
  });

  if (!parsed.success) {
    return {
      kind: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아.",
    };
  }

  try {
    // 로그인된 사용자만 사용 가능 (남용 방지).
    await requireProfile();

    const output = await generateJson({
      schema: compatibilityAiSchema,
      userPrompt: buildTwoPersonCompatPrompt({
        personA: {
          name: parsed.data.aName,
          birthDate: parsed.data.aBirthDate,
          calendarSystem: parsed.data.aCalendarSystem,
          gender: parsed.data.aGender,
          mbti: parsed.data.aMbti?.toUpperCase() || null,
        },
        personB: {
          name: parsed.data.bName,
          birthDate: parsed.data.bBirthDate,
          calendarSystem: parsed.data.bCalendarSystem,
          gender: parsed.data.bGender,
          mbti: parsed.data.bMbti?.toUpperCase() || null,
        },
      }),
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.fortuneMaxTokens,
    });

    return {
      kind: "success",
      result: {
        aName: parsed.data.aName,
        bName: parsed.data.bName,
        aBirthDate: parsed.data.aBirthDate,
        bBirthDate: parsed.data.bBirthDate,
        output,
      },
    };
  } catch (e) {
    return {
      kind: "error",
      message:
        "두 사람의 기운을 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }
}
