"use server";

/**
 * 궁합 풀이 Server Actions.
 */
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { createCompatibility } from "@/lib/compatibility/service";
import { generateJson } from "@/lib/ai/generate";
import { buildTwoPersonCompatPrompt } from "@/lib/ai/prompts";
import {
  compatibilityAiSchema,
  type CompatibilityAiOutput,
  compatPurposeSchema,
  type CompatPurposeOutput,
  compatConflictSchema,
  type CompatConflictOutput,
  compatTodaySchema,
  type CompatTodayOutput,
} from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { CHARACTER_CARD_VOICE } from "@/lib/ai/character-voice";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

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
  kind: "idle" | "done" | "error";
  message?: string;
  quotaExceeded?: boolean;
}


/**
 * 새 궁합 풀이.
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

  let profile;
  try {
    const profileData = await requireProfile();
    profile = profileData.profile;
  } catch (e) {
    return {
      kind: "error",
      message: "인증 오류: " + (e instanceof Error ? e.message : "다시 로그인해 줘."),
    };
  }

  let result;
  try {
    result = await createCompatibility({
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
  } catch (e) {
    return {
      kind: "error",
      message: "궁합을 풀이하는 중 오류가 생겼어: " + (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  if (result.ok) {
    revalidatePath(COMPATIBILITY_ROUTE);
    return { kind: "done" };
  }

  if (result.reason === "quota_exceeded") {
    return {
      kind: "error",
      quotaExceeded: true,
      message: `오늘 무료 궁합은 ${result.max}회까지야. 라이트로 무제한 풀어볼래?`,
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
    aGender: string;
    bGender: string;
    aMbti?: string;
    bMbti?: string;
    output: CompatibilityAiOutput;
  };
}


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
      maxTokens: AI_LIMITS.compatibilityMaxTokens,
      locale: await getLocale(),
    });

    return {
      kind: "success",
      result: {
        aName: parsed.data.aName,
        bName: parsed.data.bName,
        aBirthDate: parsed.data.aBirthDate,
        bBirthDate: parsed.data.bBirthDate,
        aGender: parsed.data.aGender,
        bGender: parsed.data.bGender,
        aMbti: parsed.data.aMbti?.toUpperCase() || undefined,
        bMbti: parsed.data.bMbti?.toUpperCase() || undefined,
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

// =============================================================================
// 라이트 — 궁합 추가 분석 (캐시 없음, 매번 새로 생성)
// =============================================================================

const PREMIUM_ONLY_MESSAGE = "라이트 전용 기능이야.";

/** 라이트 가드 — 통과 시 null, 실패 시 에러 메시지 반환. */
async function ensurePremium(): Promise<string | null> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) return PREMIUM_ONLY_MESSAGE;
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "다시 로그인해 줘.";
  }
}

/** 두 사람 정보를 사람이 읽을 수 있는 한국어 블록으로 변환. */
function describePair(opts: {
  aName: string;
  aBirthDate: string;
  aGender?: string;
  bName: string;
  bBirthDate: string;
  bGender?: string;
  aMbti?: string;
  bMbti?: string;
}): string {
  const lines: string[] = [];
  lines.push(`[A]`);
  lines.push(`이름: ${opts.aName}`);
  lines.push(`생년월일: ${opts.aBirthDate}`);
  if (opts.aGender) lines.push(`성별: ${opts.aGender}`);
  if (opts.aMbti) lines.push(`MBTI: ${opts.aMbti}`);
  lines.push("");
  lines.push(`[B]`);
  lines.push(`이름: ${opts.bName}`);
  lines.push(`생년월일: ${opts.bBirthDate}`);
  if (opts.bGender) lines.push(`성별: ${opts.bGender}`);
  if (opts.bMbti) lines.push(`MBTI: ${opts.bMbti}`);
  return lines.join("\n");
}

export interface CompatPurposeState {
  kind: "idle" | "success" | "error";
  data?: CompatPurposeOutput;
  message?: string;
}

/**
 * 관계 목적별 궁합 점수 — 연애·결혼·비즈니스·친구 4가지 목적별 점수.
 * 매번 즉시 생성(캐시 없음).
 */
export async function generateCompatPurposeAction(
  aName: string,
  aBirthDate: string,
  bName: string,
  bBirthDate: string,
  aMbti?: string,
  bMbti?: string,
): Promise<CompatPurposeState> {
  const guard = await ensurePremium();
  if (guard) return { kind: "error", message: guard };

  try {
    const userPrompt = `${describePair({
      aName,
      aBirthDate,
      bName,
      bBirthDate,
      aMbti,
      bMbti,
    })}

[지시]
두 사람이 각각 다른 관계 목적(연애·결혼·비즈니스·친구)에서 얼마나 잘 맞는지 0~100점으로 분석해줘.
사주·별자리·MBTI(있다면)를 종합적으로 고려해.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.

반드시 아래 JSON 형식으로만 응답해. 마크다운·설명 없이 JSON만:
{
  "romance": 0~100,
  "marriage": 0~100,
  "business": 0~100,
  "friendship": 0~100,
  "bestPurpose": "가장 잘 맞는 관계 1가지 (예: '연애', '결혼', '비즈니스', '친구')",
  "worstPurpose": "가장 안 맞는 관계 1가지",
  "summary": "두 사람 관계의 핵심을 한 문장으로"
}`;

    const data = await generateJson({
      schema: compatPurposeSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
      locale: await getLocale(),
    });

    return { kind: "success", data };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "분석에 실패했어.",
    };
  }
}

export interface CompatConflictState {
  kind: "idle" | "success" | "error";
  data?: CompatConflictOutput;
  message?: string;
}

/**
 * 갈등 패턴 + 화해법 — 두 사람이 어디서 충돌하는지 + 해결법.
 * 매번 즉시 생성(캐시 없음).
 */
export async function generateCompatConflictAction(
  aName: string,
  aBirthDate: string,
  aGender: string,
  bName: string,
  bBirthDate: string,
  bGender: string,
  aMbti?: string,
  bMbti?: string,
): Promise<CompatConflictState> {
  const guard = await ensurePremium();
  if (guard) return { kind: "error", message: guard };

  try {
    const userPrompt = `${describePair({
      aName,
      aBirthDate,
      aGender,
      bName,
      bBirthDate,
      bGender,
      aMbti,
      bMbti,
    })}

[지시]
두 사람이 갈등할 때 어디서 부딪히는지 + 화해법을 분석해줘.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.

반드시 아래 JSON 형식으로만 응답해. 마크다운·설명 없이 JSON만:
{
  "triggers": ["갈등 유발 상황 1", "갈등 유발 상황 2", "갈등 유발 상황 3"],
  "pattern": "두 사람 사이에서 반복되는 갈등 패턴 1~2문장",
  "resolution": "갈등을 풀 수 있는 화해·해결법 2~3문장",
  "avoidTip": "갈등을 미리 예방하는 팁 1문장"
}`;

    const data = await generateJson({
      schema: compatConflictSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
      locale: await getLocale(),
    });

    return { kind: "success", data };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "분석에 실패했어.",
    };
  }
}

export interface CompatTodayState {
  kind: "idle" | "success" | "error";
  data?: CompatTodayOutput;
  message?: string;
}

/**
 * 오늘 이 사람에게 어떻게 — 오늘의 일진 × 두 사람 궁합 기반 즉시 조언.
 * 매번 즉시 생성(캐시 없음, 매일 달라짐).
 */
export async function generateCompatTodayAction(
  aName: string,
  bName: string,
  compatScore: number,
  aMbti?: string,
  bMbti?: string,
): Promise<CompatTodayState> {
  const guard = await ensurePremium();
  if (guard) return { kind: "error", message: guard };

  try {
    const todayKst = (() => {
      const d = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
      );
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    const mbtiLine: string[] = [];
    if (aMbti) mbtiLine.push(`A MBTI: ${aMbti}`);
    if (bMbti) mbtiLine.push(`B MBTI: ${bMbti}`);

    const userPrompt = `[A] ${aName}
[B] ${bName}
두 사람의 종합 궁합 점수: ${compatScore}점
${mbtiLine.join("\n")}
오늘 날짜: ${todayKst}

[지시]
오늘의 일진과 두 사람의 궁합을 함께 살펴 ${aName}이(가) ${bName}에게 오늘 어떻게 접근하면 좋을지 조언해줘.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.

반드시 아래 JSON 형식으로만 응답해. 마크다운·설명 없이 JSON만:
{
  "isGoodDay": true 또는 false (오늘 두 사람이 가까이 지내기 좋은 날인지),
  "approach": "오늘 어떤 태도·접근으로 다가가면 좋은지 2~3문장",
  "messageIdea": "오늘 ${bName}에게 보내기 좋은 메시지 톤·아이디어 1문장",
  "caution": "오늘 ${bName}에게 절대 하지 말아야 할 행동·말 1문장"
}`;

    const data = await generateJson({
      schema: compatTodaySchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: CHARACTER_CARD_VOICE[getTodayCharacter()],
      locale: await getLocale(),
    });

    return { kind: "success", data };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "분석에 실패했어.",
    };
  }
}
