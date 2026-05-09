/**
 * 르노르망(Lenormand) 카드 점술 비즈니스 로직.
 *
 * - single: 한 장 — 오늘의 메시지
 * - three: 세 장 — 과거·현재·미래
 *
 * 무료 사용자는 일일 한도(`FREE_DAILY_LENORMAND`) 적용.
 */
import "server-only";

import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  lenormandReadings,
  type LenormandReading,
  type Profile,
} from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { lenormandSingleAiSchema } from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { drawLenormand } from "@/lib/lenormand/draw";
import type { LenormandCard } from "@/lib/lenormand/cards";

/** 무료 사용자 일일 르노르망 뽑기 한도. */
export const FREE_DAILY_LENORMAND = 3;

/** DB 의 cards 컬럼에 저장되는 형태. */
export interface LenormandCardEntry {
  id: number;
  position: "single" | "past" | "present" | "future";
}

export type LenormandResult =
  | { ok: true; reading: LenormandReading }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * 오늘(KST 기준) 사용자가 뽑은 르노르망 결과 목록.
 */
export async function getTodayLenormandReadings(
  userId: string,
): Promise<LenormandReading[]> {
  const todayKstStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

  return db
    .select()
    .from(lenormandReadings)
    .where(
      and(
        eq(lenormandReadings.userId, userId),
        gte(lenormandReadings.createdAt, todayStartUtc),
      ),
    )
    .orderBy(desc(lenormandReadings.createdAt))
    .limit(20);
}

/**
 * 르노르망 점술 1회를 수행한다.
 */
export async function createLenormandReading(opts: {
  profile: Profile;
  spreadType: "single" | "three";
  question: string | null;
  isSubscribed: boolean;
}): Promise<LenormandResult> {
  // 1. 한도 검사 (무료 사용자만).
  if (!opts.isSubscribed) {
    const todayKstStr = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });
    const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

    const [row] = await db
      .select({ value: count() })
      .from(lenormandReadings)
      .where(
        and(
          eq(lenormandReadings.userId, opts.profile.userId),
          gte(lenormandReadings.createdAt, todayStartUtc),
        ),
      );
    const used = Number(row?.value ?? 0);
    if (used >= FREE_DAILY_LENORMAND) {
      return {
        ok: false,
        reason: "quota_exceeded",
        max: FREE_DAILY_LENORMAND,
      };
    }
  }

  // 2. 카드 뽑기.
  const cardCount = opts.spreadType === "three" ? 3 : 1;
  const seedSource =
    Date.now() ^ (opts.profile.userId.charCodeAt(0) * 997);
  const drawnCards: LenormandCard[] = drawLenormand(cardCount, seedSource);

  // 3. AI 프롬프트 구성.
  const positions: ReadonlyArray<"past" | "present" | "future"> = [
    "past",
    "present",
    "future",
  ];
  const positionLabel: Record<string, string> = {
    past: "과거",
    present: "현재",
    future: "미래",
  };

  const cardDescriptions = drawnCards
    .map((c, i) => {
      const pos =
        opts.spreadType === "three"
          ? ` (${positionLabel[positions[i] ?? "present"]})`
          : "";
      return `${c.id}. ${c.nameKo}${pos}: ${c.meaning} [키워드: ${c.keywords.join(", ")}]`;
    })
    .join("\n");

  const userCtx = buildUserContext({ profile: opts.profile });
  const questionPart = opts.question ? `\n질문: ${opts.question}` : "";
  const spreadGuide =
    opts.spreadType === "three"
      ? "과거·현재·미래 흐름을 연결해서"
      : "카드 하나의 의미를";
  const combinationGuide =
    opts.spreadType === "three"
      ? "세 카드의 조합이 말하는 핵심 메시지"
      : "이 카드가 전하는 핵심";

  const userPrompt = `[사용자 정보]
${userCtx}${questionPart}

[뽑힌 르노르망 카드]
${cardDescriptions}

[해석 지침]
- 르노르망은 카드 조합의 의미를 중심으로 해석합니다.
- ${spreadGuide} 구체적으로 풀어주세요.
- 실용적이고 직관적인 언어로 작성해주세요.
- 마크다운 기호(*, #, - 등)는 사용하지 마세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "interpretation": "카드 해석 본문 (5~8문장, 줄바꿈 포함 가능)",
  "summary": "한 줄 요약 (20자 이내)",
  "cardCombination": "${combinationGuide} (1~2문장)"
}`;

  // 4. AI 호출.
  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: lenormandSingleAiSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.fortuneMaxTokens,
      systemSuffix:
        "당신은 르노르망 카드 해석 전문가입니다. 반드시 JSON 형식으로만 응답하세요.",
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "르노르망의 메시지를 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 5. DB 저장.
  const cardsPayload: LenormandCardEntry[] = drawnCards.map((c, i) => ({
    id: c.id,
    position:
      opts.spreadType === "three"
        ? (positions[i] ?? "present")
        : "single",
  }));

  const interpretationText = aiOutput.cardCombination
    ? `${aiOutput.cardCombination}\n\n${aiOutput.interpretation}`
    : aiOutput.interpretation;

  const [inserted] = await db
    .insert(lenormandReadings)
    .values({
      userId: opts.profile.userId,
      spreadType: opts.spreadType,
      question: opts.question,
      cards: cardsPayload,
      interpretation: interpretationText,
      model: AI_MODELS.premium,
    })
    .returning();

  if (!inserted) {
    return {
      ok: false,
      reason: "ai_failed",
      message: "르노르망 결과 저장에 실패했어요.",
    };
  }

  return { ok: true, reading: inserted };
}
