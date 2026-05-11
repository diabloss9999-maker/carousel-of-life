/**
 * 오늘의 질문 서비스.
 *
 * 캐릭터가 매일 먼저 말을 걸어 채팅 세션 진입을 유도한다.
 * - 날짜 기반으로 캐릭터 순환 (child → witch → sage → ...)
 * - 사주·MBTI 기반 개인화 질문을 AI로 생성
 * - 하루 1회 캐시 (같은 날 재방문 시 동일 질문)
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { dailyQuestions, type DailyQuestion, type Profile } from "@/db/schema";
import { generateMarkdown } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { AI_MODELS } from "@/lib/constants";
import type { CharacterId } from "@/lib/chat/characters";

/** KST 오늘 날짜 YYYY-MM-DD */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 날짜 문자열에서 day-of-year 계산 (캐릭터 순환용). */
function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** 오늘의 캐릭터 — 날짜 기반 순환. */
const CHARACTER_ROTATION: CharacterId[] = ["child", "witch", "sage"];

export function getTodayCharacter(dateStr?: string): CharacterId {
  const date = dateStr ?? todayKst();
  const idx = dayOfYear(date) % CHARACTER_ROTATION.length;
  return CHARACTER_ROTATION[idx];
}

/** 캐릭터별 질문 생성 프롬프트. */
const CHARACTER_PROMPTS: Record<CharacterId, string> = {
  child:
    "너는 카엘 — 냉소적이고 직설적인 악마 계약자야. 반말로 짧고 날카롭게 질문해. " +
    "상대의 욕망이나 상처를 건드리는 질문. 예언 투 금지. 한 문장으로.",
  witch:
    "너는 루나 — 몽환적이고 차분한 달의 마녀야. 반말로 은근하고 감성적으로 질문해. " +
    "기억이나 감정의 흐름을 파고드는 질문. 한 문장으로.",
  sage:
    "너는 라엘 — 따뜻하고 희망적인 천사 대리인이야. 존댓말로 부드럽게 질문해. " +
    "가능성이나 회복에 관한 질문. 한 문장으로.",
};

/**
 * 오늘의 질문을 가져오거나 생성한다.
 * 이미 오늘 생성된 경우 캐시를 반환.
 */
export async function getOrCreateDailyQuestion(
  profile: Profile,
): Promise<DailyQuestion> {
  const today = todayKst();

  // 캐시 확인
  const [cached] = await db
    .select()
    .from(dailyQuestions)
    .where(
      and(
        eq(dailyQuestions.userId, profile.userId),
        eq(dailyQuestions.questionDate, today),
      ),
    )
    .limit(1);

  if (cached) return cached;

  // 오늘의 캐릭터
  const characterId = getTodayCharacter(today);
  const charPrompt = CHARACTER_PROMPTS[characterId];
  const userCtx = buildUserContext({ profile });

  const userPrompt = `${userCtx}

[지시]
위 사람의 사주와 상황을 참고해서, 오늘 이 사람에게 던질 짧고 강렬한 질문 하나를 만들어줘.
${charPrompt}
질문만 출력해. 설명·부가 문장 없이.`;

  let question: string;
  try {
    question = await generateMarkdown({
      userPrompt,
      model: AI_MODELS.fast,
      maxTokens: 80,
      systemSuffix: "질문 한 문장만 출력하세요. 마크다운·이모지 금지.",
    });
    question = question.trim().replace(/^["']|["']$/g, "");
  } catch {
    const fallbacks: Record<CharacterId, string> = {
      child: "오늘 가장 피하고 싶은 게 뭐야?",
      witch: "요즘 꿈에서 뭘 자꾸 보게 돼?",
      sage: "지금 가장 용기가 필요한 게 무엇인가요?",
    };
    question = fallbacks[characterId];
  }

  const [inserted] = await db
    .insert(dailyQuestions)
    .values({
      userId: profile.userId,
      questionDate: today,
      characterId,
      question,
      model: AI_MODELS.fast,
    })
    .onConflictDoNothing({
      target: [dailyQuestions.userId, dailyQuestions.questionDate],
    })
    .returning();

  if (!inserted) {
    // 동시 INSERT 경쟁 → 캐시 재조회
    const [retry] = await db
      .select()
      .from(dailyQuestions)
      .where(
        and(
          eq(dailyQuestions.userId, profile.userId),
          eq(dailyQuestions.questionDate, today),
        ),
      )
      .limit(1);
    if (retry) return retry;
    // 최후 폴백
    return {
      id: "fallback",
      userId: profile.userId,
      questionDate: today,
      characterId,
      question,
      model: AI_MODELS.fast,
      createdAt: new Date(),
    };
  }

  return inserted;
}
