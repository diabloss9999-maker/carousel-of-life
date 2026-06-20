"use server";

/**
 * 최애(bias) 설정 서버 액션.
 *
 * 사용자가 한 멤버를 '최애'로 지정/해제한다. profiles.bias_character 에 저장.
 * 최애는 선톡 발신자 우선순위 + 멤버 프롬프트(특별 애정 / 다른 멤버의 가벼운
 * 질투)에 사용된다.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth/get-user";
import type { CharacterId } from "@/lib/chat/characters";

/**
 * 최애를 설정하거나(characterId) 해제한다(null).
 */
export async function setBiasAction(
  characterId: CharacterId | null,
): Promise<{ ok: true }> {
  const user = await requireUser();

  await db
    .update(profiles)
    .set({ biasCharacter: characterId })
    .where(eq(profiles.userId, user.id));

  return { ok: true };
}
