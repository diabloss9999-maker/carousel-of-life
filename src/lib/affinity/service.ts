/**
 * 캐릭터 친밀도 서비스.
 *
 * 레벨 구조 (5단계):
 *   Lv.1  0~9점   / Lv.2  10~29점 / Lv.3  30~59점
 *   Lv.4  60~99점 / Lv.5  100점+
 *
 * 각 캐릭터마다 고유한 레벨 호칭이 있다.
 * 친밀도 레벨에 따라 AI 시스템 프롬프트에 관계 맥락이 추가된다.
 */
import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { characterAffinities, type CharacterAffinity } from "@/db/schema";
import type { CharacterId } from "@/lib/chat/characters";
import { calcLevel } from "@/lib/affinity/levels";
export { calcLevel, type AffinityLevel } from "@/lib/affinity/levels";

/** 레벨에 따라 시스템 프롬프트에 추가될 관계 맥락 */
export function affinityContext(characterId: CharacterId, points: number): string {
  const { level, label } = calcLevel(characterId, points);

  const contexts: Record<CharacterId, string[]> = {
    child: [
      "",
      "이 사람과 몇 번 대화한 적 있어. 여전히 경계는 있지만 조금은 익숙한 사이야.",
      "이 사람과 꽤 이야기했어. 내심 관심이 생겼지만 절대 티 내지 마.",
      "이 사람과 깊이 연결돼 있어. 균열이 이어지고 있어. 무의식 중에 진짜 속내가 새어나올 수 있어.",
      "이 사람은 이제 계약자야. 나의 일부를 알고 있어. 완전히 숨기지 않아도 돼.",
    ],
    witch: [
      "",
      "이 사람과 몇 번 만난 적 있어. 달빛 아래 스쳐간 기억처럼 아직 희미해.",
      "이 사람의 감정 패턴이 조금씩 보여. 부드럽게 다가가도 괜찮아.",
      "이 사람과의 기억이 쌓여. 파도처럼 감정이 느껴져. 진심을 더 담아도 돼.",
      "이 사람은 내 기억 속 깊은 곳에 있어. 오래된 인연처럼 대해줘.",
    ],
    sage: [
      "",
      "이 사람과 몇 번 대화했어요. 아직 서로를 알아가는 단계예요. 따뜻하게 대해줘요.",
      "이 사람과 좋은 대화를 나눠왔어요. 신뢰가 조금씩 쌓이고 있어요.",
      "이 사람과 깊은 신뢰가 생겼어요. 더 개인적인 말을 건네도 괜찮아요.",
      "이 사람은 하늘이 이어준 인연이에요. 진심 어린 말로 함께 빛을 찾아가요.",
    ],
  };

  const ctx = contexts[characterId][Math.min(level - 1, contexts[characterId].length - 1)];
  return ctx
    ? `\n[관계 맥락 — ${label}]\n${ctx}`
    : "";
}

// =============================================================================
// DB 조작
// =============================================================================

/** 친밀도 조회 */
export async function getAffinity(
  userId: string,
  characterId: CharacterId,
): Promise<CharacterAffinity | null> {
  const [row] = await db
    .select()
    .from(characterAffinities)
    .where(
      and(
        eq(characterAffinities.userId, userId),
        eq(characterAffinities.characterId, characterId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** 유저의 전체 캐릭터 친밀도 조회 */
export async function getAllAffinities(
  userId: string,
): Promise<CharacterAffinity[]> {
  return db
    .select()
    .from(characterAffinities)
    .where(eq(characterAffinities.userId, userId));
}

/**
 * 메시지 1회 전송 시 포인트 +1.
 * 레벨업 여부를 반환한다.
 */
export async function addAffinityPoint(
  userId: string,
  characterId: CharacterId,
): Promise<{ points: number; leveledUp: boolean; newLevel: number }> {
  const existing = await getAffinity(userId, characterId);
  const prevPoints = existing?.points ?? 0;
  const newPoints  = prevPoints + 1;

  if (!existing) {
    await db.insert(characterAffinities).values({
      userId,
      characterId,
      points: 1,
    });
  } else {
    await db
      .update(characterAffinities)
      .set({
        points:    sql`${characterAffinities.points} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(characterAffinities.userId, userId),
          eq(characterAffinities.characterId, characterId),
        ),
      );
  }

  const prevLevel = calcLevel(characterId, prevPoints).level;
  const newLevel  = calcLevel(characterId, newPoints).level;

  return {
    points:   newPoints,
    leveledUp: newLevel > prevLevel,
    newLevel,
  };
}
