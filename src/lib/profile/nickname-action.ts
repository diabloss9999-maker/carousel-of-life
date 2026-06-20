"use server";

/**
 * 애칭(호칭) 설정 서버 액션.
 *
 * 멤버가 나를 부르는 애칭을 profiles.member_nickname 에 저장한다.
 * 빈 값이면 null(기본 "라이더")로 되돌린다. bubble 식 친밀감 훅.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth/get-user";
import { MEMBER_NICKNAME_MAX } from "@/lib/profile/nickname";

export async function setMemberNicknameAction(
  nickname: string,
): Promise<{ ok: true; nickname: string | null }> {
  const user = await requireUser();

  const trimmed = nickname.trim().slice(0, MEMBER_NICKNAME_MAX);
  const value = trimmed.length > 0 ? trimmed : null;

  await db
    .update(profiles)
    .set({ memberNickname: value })
    .where(eq(profiles.userId, user.id));

  return { ok: true, nickname: value };
}
