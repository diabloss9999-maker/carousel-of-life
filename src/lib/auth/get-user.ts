/**
 * 서버 컴포넌트·Server Action 에서 인증 상태와 프로필을 조회하는 헬퍼.
 */
import "server-only";

import { redirect } from "next/navigation";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * 현재 인증된 사용자를 반환한다.
 *
 * @returns user 가 있으면 user, 없으면 null.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 인증 필수. 미로그인 시 /login 으로 리다이렉트.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect(ROUTES.login);
  }
  return user;
}

/**
 * 인증 + 프로필 필수.
 *
 * - 미로그인 → /login
 * - 미온보딩 (profile 없음) → /onboarding
 */
export async function requireProfile() {
  const user = await requireUser();

  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (rows.length === 0) {
    redirect(ROUTES.onboarding);
  }

  return { user, profile: rows[0] };
}

/**
 * 프로필 조회 (없으면 null).
 *
 * 리다이렉트 없이 단순 조회만 필요한 경우 사용.
 */
export async function getProfile(userId: string) {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}
