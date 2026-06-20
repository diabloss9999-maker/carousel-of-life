"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { dailyIljin, profiles } from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { iljinAiSchema, type IljinAiOutput } from "@/lib/ai/types";
import {
  NEUTRAL_SAJU_VOICE,
  NEUTRAL_SAJU_VOICE_ID,
} from "@/lib/ai/character-voice";
import { AI_MODELS } from "@/lib/constants";
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { enforceAiRateLimit, RateLimitedError } from "@/lib/rate-limit/in-memory";
import { calculateSaju } from "@/lib/saju/calculate";
import { getOrCreateDeepReading } from "@/lib/saju/deep-reading";
import { annotateHanjaDeep } from "@/lib/saju/hanja-annotate";
import { getDayPillar } from "@/lib/saju/iljin";
import {
  analyzeDayRelationship,
  type RelationshipResult,
} from "@/lib/saju/relationships";

export interface CalculateSajuState {
  kind: "idle" | "error";
  message?: string;
}

export async function calculateSajuAction(): Promise<CalculateSajuState> {
  try {
    const { profile } = await requireProfile();
    const saju = await calculateSaju(profile);
    await db
      .update(profiles)
      .set({ sajuPillars: saju.pillars, fiveElements: saju.fiveElements })
      .where(eq(profiles.userId, profile.userId));
    revalidatePath("/saju");
    return { kind: "idle" };
  } catch (e) {
    return {
      kind: "error",
      message:
        "사주를 계산하지 못했어요. " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }
}

export async function resetSajuAction(): Promise<CalculateSajuState> {
  try {
    const { profile } = await requireProfile();
    await db
      .update(profiles)
      .set({ sajuPillars: null, fiveElements: null, sajuDeepReading: null })
      .where(eq(profiles.userId, profile.userId));

    const saju = await calculateSaju(profile);
    await db
      .update(profiles)
      .set({ sajuPillars: saju.pillars, fiveElements: saju.fiveElements })
      .where(eq(profiles.userId, profile.userId));
    revalidatePath("/saju");
    return { kind: "idle" };
  } catch (e) {
    return {
      kind: "error",
      message:
        "사주를 다시 계산하지 못했어요. " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }
}

export interface DeepReadingState {
  kind: "idle" | "error";
  message?: string;
  premiumOnly?: boolean;
}

export async function generateDeepReadingAction(): Promise<DeepReadingState> {
  const { profile } = await requireProfile();

  try {
    enforceAiRateLimit(profile.userId, "saju");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `잠시 후 다시 시도해주세요. (${e.retryAfterSec}s)`,
      };
    }
    throw e;
  }

  const subscribed = await hasActiveSubscription(profile.userId);
  if (!subscribed) {
    const tErr = await getTranslations("actionErrors");
    return {
      kind: "error",
      premiumOnly: true,
      message: tErr("sajuDeepPremium"),
    };
  }

  const result = await getOrCreateDeepReading(profile);
  if (!result.ok) {
    return {
      kind: "error",
      message: result.message,
    };
  }

  revalidatePath("/saju");
  return { kind: "idle" };
}

export interface IljinState {
  kind: "idle" | "success" | "error";
  data?: IljinAiOutput;
  relationships?: RelationshipResult[];
  message?: string;
}

const iljinCacheSchema = z.object({
  voice: z.literal(NEUTRAL_SAJU_VOICE_ID),
  aiOutput: iljinAiSchema,
  relationships: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      energy: z.string(),
      detail: z.string(),
    }),
  ),
});

export async function generateIljinAction(): Promise<IljinState> {
  try {
    const { profile } = await requireProfile();

    const subscribed = await hasActiveSubscription(profile.userId);
    const tErr = await getTranslations("actionErrors");
    if (!subscribed) {
      return { kind: "error", message: tErr("premiumOnly") };
    }

    if (!profile.sajuPillars) {
      return { kind: "error", message: tErr("sajuRequired") };
    }

    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });

    const [cached] = await db
      .select()
      .from(dailyIljin)
      .where(
        and(
          eq(dailyIljin.userId, profile.userId),
          eq(dailyIljin.iljinDate, today),
        ),
      )
      .limit(1);

    if (cached) {
      const parsed = iljinCacheSchema.safeParse(cached.data);
      if (parsed.success) {
        return {
          kind: "success",
          data: parsed.data.aiOutput,
          relationships: parsed.data.relationships as RelationshipResult[],
        };
      }
    }

    const todayPillar = getDayPillar(new Date());
    const pillars = profile.sajuPillars as {
      year: { stem: string; branch: string } | null;
      month: { stem: string; branch: string } | null;
      day: { stem: string; branch: string } | null;
      hour: { stem: string; branch: string } | null;
    };

    const relationships = analyzeDayRelationship(
      todayPillar.stemIdx,
      todayPillar.branchIdx,
      pillars,
    );

    const relText = relationships
      .map((r) => `${r.description}: ${r.detail}`)
      .join("\n");

    const userPrompt = `사용자 정보:
- 일주: ${pillars.day?.stem ?? ""}${pillars.day?.branch ?? ""}
- 전체 사주: 년 ${pillars.year?.stem ?? ""}${pillars.year?.branch ?? ""} / 월 ${pillars.month?.stem ?? ""}${pillars.month?.branch ?? ""} / 일 ${pillars.day?.stem ?? ""}${pillars.day?.branch ?? ""} / 시 ${pillars.hour?.stem ?? ""}${pillars.hour?.branch ?? ""}

오늘 일주: ${todayPillar.stemHanja}${todayPillar.branchHanja}일 (${todayPillar.stemKo}${todayPillar.branchKo})

충합 관계 분석:
${relText || "특별히 강하게 드러나는 충합 관계는 없습니다."}

오늘 하루를 사주 일진 관점에서 해석해주세요.
특정 멤버, 아이돌, 팬서비스, 무대 설정은 언급하지 마세요.
차분한 존댓말 리포트 톤으로 쓰고, 예언처럼 단정하지 마세요.
사용자가 오늘 바로 참고할 수 있는 행동 기준을 먼저 주세요.

한자 표기 규칙:
- todayPillar 필드에는 "${todayPillar.stemHanja}${todayPillar.branchHanja}일"처럼 짧게 넣어주세요.
- 본문은 전문용어를 남발하지 말고 쉬운 한국어로 설명해주세요.

마크다운 없이 JSON만 반환하세요.
{
  "todayPillar": "${todayPillar.stemHanja}${todayPillar.branchHanja}일",
  "overallEnergy": "positive" 또는 "neutral" 또는 "caution",
  "mainMessage": "오늘 일진의 핵심을 두 문장으로",
  "advice": "오늘 하루를 어떻게 지내면 좋을지 구체적인 조언 2~3문장",
  "luckyTime": "어느 시간대가 좋은지",
  "caution": "주의할 점 한 문장"
}`;

    const rawAiOutput = await generateJson({
      schema: iljinAiSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: 800,
      systemSuffix: NEUTRAL_SAJU_VOICE,
      locale: await getLocale(),
    });

    const aiOutput: IljinAiOutput = annotateHanjaDeep(rawAiOutput);

    const saveData = {
      voice: NEUTRAL_SAJU_VOICE_ID,
      aiOutput,
      relationships,
    };

    if (cached) {
      await db
        .update(dailyIljin)
        .set({ data: saveData })
        .where(eq(dailyIljin.id, cached.id));
    } else {
      await db
        .insert(dailyIljin)
        .values({
          userId: profile.userId,
          iljinDate: today,
          data: saveData,
        })
        .onConflictDoNothing();
    }

    return { kind: "success", data: aiOutput, relationships };
  } catch (e) {
    return {
      kind: "error",
      message:
        e instanceof Error
          ? e.message
          : (await getTranslations("actionErrors"))("iljinError"),
    };
  }
}
