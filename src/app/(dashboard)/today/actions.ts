"use server";

/**
 * 오늘의 운세 — Server Action.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { dailyCareerTips } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { generateJson } from "@/lib/ai/generate";
import {
  careerTipsSchema,
  type CareerTipsOutput,
} from "@/lib/ai/types";
import { AI_MODELS } from "@/lib/constants";
import { getOrCreateDailyFortune } from "@/lib/fortunes/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

/** KST 오늘 날짜 YYYY-MM-DD */
function todayKst(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

export interface CareerTipsState {
  kind: "idle" | "loading" | "success" | "error";
  tips?: CareerTipsOutput["tips"];
  message?: string;
}

/**
 * 직장 운세 프리미엄 전용 — "직장에서 예쁨받는 방법" 3가지 팁을 AI로 생성한다.
 *
 * - 프리미엄 구독자에게만 동작한다.
 * - 사용자 MBTI/생년월일/성별을 기반으로 개인화된 팁을 생성한다.
 */
export async function generateCareerTipsAction(): Promise<CareerTipsState> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    if (!subscribed) {
      return { kind: "error", message: "프리미엄 전용 기능이야." };
    }

    const today = todayKst();

    // 오늘 이미 생성된 팁이 있으면 재사용
    const [cached] = await db
      .select()
      .from(dailyCareerTips)
      .where(
        and(
          eq(dailyCareerTips.userId, profile.userId),
          eq(dailyCareerTips.tipDate, today),
        ),
      )
      .limit(1);

    if (cached) {
      const tips = cached.tips as CareerTipsOutput["tips"];
      return { kind: "success", tips };
    }

    // 없으면 AI 생성
    const mbti = profile.mbti ?? "알 수 없음";
    const userPrompt = `사용자 정보:
- MBTI: ${mbti}
- 생년월일: ${profile.birthDate}
- 성별: ${profile.gender}

위 사용자에게 맞는 "직장에서 예쁨받는 방법" 3가지를 알려줘.
각 팁은 짧은 제목(10자 내외)과 설명(2문장 이내)으로 구성해.
구체적이고 실천 가능하게, 이 사람의 MBTI 성격에 맞게 작성해줘.

반드시 아래 JSON 형식으로만 응답해. 설명이나 마크다운 없이 JSON만 출력해:
{
  "tips": [
    { "title": "팁 제목", "description": "팁 설명 1~2문장" },
    { "title": "팁 제목", "description": "팁 설명 1~2문장" },
    { "title": "팁 제목", "description": "팁 설명 1~2문장" }
  ]
}`;

    const result = await generateJson({
      schema: careerTipsSchema,
      userPrompt,
      model: AI_MODELS.fast,
      maxTokens: 600,
      systemSuffix: "직장 팁 생성 전용 모드입니다. 산문·설명·마크다운은 일절 덧붙이지 말고 JSON만 응답하세요.",
    });

    // DB에 저장
    await db
      .insert(dailyCareerTips)
      .values({
        userId: profile.userId,
        tipDate: today,
        tips: result.tips,
      })
      .onConflictDoNothing();

    return { kind: "success", tips: result.tips };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "팁을 불러오지 못했어.",
    };
  }
}
