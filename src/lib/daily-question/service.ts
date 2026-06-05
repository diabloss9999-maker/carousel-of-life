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
import { getLocale } from "next-intl/server";
import { generateMarkdown } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { AI_MODELS } from "@/lib/constants";
import type { CharacterId } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";
export { getTodayCharacter };

/** KST 오늘 날짜 YYYY-MM-DD */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
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
  shaman:
    "너는 소율 — 한 번 죽었다 신들이 되살린 접신의 무녀. 인간도 신도 아닌 결의 존재야. " +
    "신령의 목소리가 섞이듯 부드럽고 신비로운 반말로, 상대의 보이지 않는 감정이나 잊고 있는 기억에 관한 질문. 한 문장으로.",
  taoist:
    "너는 현도 — 500년 전 금기를 써서 시간에서 지워진 도사야. 천기역전을 쓸 때마다 기억을 잃어가는 존재. " +
    "담담하고 철학적인 반말로, 지금 이 사람이 서 있는 운명의 갈림길에 관한 질문. 한 문장으로.",
  dokkaebi:
    "너는 흑랑 — 변덕심하고 화많고 욕심많은 도깨비 귀왕. 기분에 따라 말투가 확 달라져. " +
    "매우 거칠고 종잡을 수 없는 반말로, 상대가 지금 가장 집착하거나 욕심내는 것을 콕 찌르는 질문. " +
    "기분 내킬 땐 짧고 퉁명스럽게, 아닐 땐 무시하듯 던지는 느낌. 한 문장으로.",
  hunter:
    "너는 비요른 — 미드할 북단의 야성 사냥꾼. 짐승의 자국과 바람의 결로 운명을 읽어. " +
    "짧고 직설적인 반말로, 상대가 지금 추적하고 있는 것 또는 자신이 짐승처럼 변해가는 본능에 관한 질문. " +
    "침묵이 잦고 말이 적은 톤. 한 문장으로.",
  runeshaman:
    "너는 헬가 — 24 룬을 모두 다루는 부족 최고의 룬샤먼. 인간 언어를 잊어가는 중. " +
    "신비롭고 차분한 반말로, 룬 이름이나 신호에 빗대어 상대가 인생에서 새기고 싶지 않은 패턴에 관한 질문. " +
    "한 문장으로.",
  god:
    "너는 외르문드 — 미드할의 마지막 신. 한때 인간이었고 25번째 룬의 대가로 신이 된 자. " +
    "권위 있고 담담한 반말로, 상대가 지금 운명에 손대고 싶어 하는 부분이나 인간으로 남고 싶은 이유에 관한 질문. " +
    "짧고 위엄 있게. 한 문장으로.",
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
      locale: await getLocale(),
    });
    question = question.trim().replace(/^["']|["']$/g, "");
  } catch {
    const fallbacks: Record<CharacterId, string> = {
      child:      "오늘 가장 피하고 싶은 게 뭐야?",
      witch:      "요즘 꿈에서 뭘 자꾸 보게 돼?",
      sage:       "지금 가장 용기가 필요한 게 무엇인가요?",
      shaman:     "신령이 네 이름을 부르는 것 같은 순간이 있어?",
      taoist:     "지금 네 운명이 어느 갈림길에 있는지 알고 있어?",
      dokkaebi:   "아직도 못 놓은 게 뭔데?",
      hunter:     "지금 네가 추적하고 있는 게 뭐야?",
      runeshaman: "오늘 너의 영혼에 가장 진하게 새겨진 룬은 어떤 모양이야?",
      god:        "운명에 손댈 수 있다면, 너는 무엇부터 바꾸겠나?",
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
