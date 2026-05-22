/**
 * 친구 초대 시스템.
 *
 * 초대 코드 = userId 의 앞 8자 (소문자 hex, 충돌 가능성 매우 낮음).
 * 가입 페이지에 ?ref={code} 로 진입하면 쿠키에 저장 → 가입 완료 시
 * profiles.invitedBy 에 초대자 user_id 기록.
 */
import "server-only";

import { eq, count, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";

const CODE_LENGTH = 8;

/** userId 에서 초대 코드 생성 (UUID 의 첫 8자, 하이픈 제거). */
export function codeFromUserId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, CODE_LENGTH).toLowerCase();
}

/** 초대 코드 → userId 역추적. 충돌 시 가장 오래된 프로필 반환. */
export async function userIdFromCode(code: string): Promise<string | null> {
  const normalized = code.trim().toLowerCase();
  if (!/^[0-9a-f]{6,12}$/.test(normalized)) return null;
  const pattern = `${normalized}%`;
  const rows = await db.execute<{ user_id: string }>(sql`
    SELECT user_id FROM public.profiles
    WHERE LOWER(REPLACE(user_id::text, '-', '')) LIKE ${pattern}
    ORDER BY created_at ASC
    LIMIT 1
  `);
  // postgres-js 결과 — 배열 자체가 rows
  const arr = rows as unknown as Array<{ user_id: string }>;
  return arr[0]?.user_id ?? null;
}

/** 사용자 초대 통계 — 본인이 초대한 사람 수. */
export async function getInviteStats(
  userId: string,
): Promise<{ count: number }> {
  const [row] = await db
    .select({ c: count() })
    .from(profiles)
    .where(eq(profiles.invitedBy, userId));
  return { count: row?.c ?? 0 };
}

/** 초대 링크 빌드. */
export function buildInviteUrl(userId: string, origin: string): string {
  const code = codeFromUserId(userId);
  return `${origin}/?ref=${code}`;
}

/** 가입 시 ref 코드 처리 — 본인 self-invite 방지. */
export function validateRefCode(
  code: string,
  newUserId: string,
): boolean {
  const newUserCode = codeFromUserId(newUserId);
  return code !== newUserCode;
}
