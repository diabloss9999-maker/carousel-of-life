/**
 * 멤버 친밀도 서비스.
 *
 * 레벨 구조:
 *   Lv.1 0~9점 / Lv.2 10~19점 / ... / Lv.100 990점+
 *
 * 모든 멤버의 레벨 명칭은 "호감도"로 통일한다.
 * 호감도 레벨에 따라 AI 시스템 프롬프트에 관계 맥락이 추가된다.
 */
import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { characterAffinities, type CharacterAffinity } from "@/db/schema";
import type { CharacterId } from "@/lib/chat/characters";
import { calcLevel } from "@/lib/affinity/levels";
import { affinityRewardContext } from "@/lib/affinity/rewards";
export { calcLevel, type AffinityLevel } from "@/lib/affinity/levels";

/** 레벨에 따라 시스템 프롬프트에 추가될 관계 맥락 */
export function affinityContext(characterId: CharacterId, points: number): string {
  const { level, label } = calcLevel(characterId, points);

  const contexts: Record<CharacterId, string[]> = {
    child:      ["", "몇 번 대화한 적이 있다.", "사용자의 반복되는 고민을 조금 기억한다.", "대화 이력이 쌓였다. 더 구체적으로 반응해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    witch:      ["", "몇 번 대화한 적이 있다.", "사용자의 반복되는 감정 기운을 조금 기억한다.", "대화 이력이 쌓였다. 더 섬세하게 반응해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    sage:       ["", "몇 번 대화한 적이 있다.", "사용자의 회복 패턴을 조금 기억한다.", "대화 이력이 쌓였다. 다음 행동을 더 구체적으로 제안한다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    shaman:     ["", "몇 번 대화한 적이 있다.", "사용자의 표현 방식을 조금 기억한다.", "대화 이력이 쌓였다. 더 조심스럽게 반응해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    taoist:     ["", "몇 번 대화한 적이 있다.", "사용자의 판단 기준을 조금 기억한다.", "대화 이력이 쌓였다. 더 명료하게 정리해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    dokkaebi:   ["", "몇 번 대화한 적이 있다.", "사용자의 망설임을 조금 기억한다.", "대화 이력이 쌓였다. 더 솔직하게 반응해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    hunter:     ["", "몇 번 대화한 적이 있다.", "사용자의 행동 패턴을 조금 기억한다.", "대화 이력이 쌓였다. 더 현실적인 제안을 해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    runeshaman: ["", "몇 번 대화한 적이 있다.", "사용자의 반복 패턴을 조금 기억한다.", "대화 이력이 쌓였다. 더 분석적으로 반응해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
    god:        ["", "몇 번 대화한 적이 있다.", "사용자의 지키고 싶은 기준을 조금 기억한다.", "대화 이력이 쌓였다. 더 안정감 있게 반응해도 된다.", "오래 대화해 온 사람처럼 맥락을 이어간다."],
  };

  const ctx = contexts[characterId][Math.min(level - 1, contexts[characterId].length - 1)];
  const base = ctx ? `\n[관계 맥락 — ${label}]\n${ctx}` : "";
  // 레벨 보상 — 친밀도가 오를수록 풀리는 친밀함(농담·반말·속마음 등)을 함께 주입.
  return base + affinityRewardContext(level);
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

/** 유저의 전체 멤버 친밀도 조회 */
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
