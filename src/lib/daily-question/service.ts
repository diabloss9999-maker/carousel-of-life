/**
 * 오늘의 질문 서비스.
 *
 * 홈에서는 중립적인 대화 주제만 보여주고, 멤버 말투는 채팅 진입 후 노출한다.
 * - 날짜 기반으로 채팅 진입 대상 멤버 순환 (child → witch → sage → ...)
 * - 사주·MBTI 기반 개인화 대화 주제를 AI로 생성
 * - 하루 1회 캐시 (같은 날 재방문 시 동일 질문)
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { dailyQuestions, type DailyQuestion, type Profile } from "@/db/schema";
import { getLocale } from "next-intl/server";
import { generateMarkdown } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { AI_MODELS } from "@/lib/constants";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
export { getTodayCharacter };

/** KST 오늘 날짜 YYYY-MM-DD */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

const NEUTRAL_QUESTION_PROMPT =
  "중립적이고 차분한 한국어로, 사용자가 오늘 대화에서 풀어볼 만한 질문을 한 문장으로 작성해. " +
  "특정 멤버 이름, 멤버 말투, 반말 멤버 대사, 배경 설정을 드러내지 마. " +
  "예언처럼 단정하지 말고, 사용자가 자신의 선택·감정·관계·일정을 돌아보게 하는 질문으로.";

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

  // 오늘의 멤버
  const characterId = getTodayCharacter(today);
  const userCtx = buildUserContext({ profile });

  const userPrompt = `${userCtx}

[지시]
위 사람의 사주와 상황을 참고해서, 오늘 이 사람이 대화에서 풀어볼 짧은 질문 하나를 만들어줘.
${NEUTRAL_QUESTION_PROMPT}
질문만 출력해. 설명·부가 문장 없이.`;

  let question: string;
  try {
    question = await generateMarkdown({
      userPrompt,
      model: AI_MODELS.fast,
      maxTokens: 80,
      systemSuffix: "질문 한 문장만 출력하세요. 마크다운·이모지 금지.",
      locale: await getLocale(),
    });
    question = question.trim().replace(/^["']|["']$/g, "");
  } catch {
    question = "오늘 가장 먼저 정리하고 싶은 선택이나 감정은 무엇인가요?";
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
