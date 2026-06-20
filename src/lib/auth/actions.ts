"use server";

/**
 * 인증 관련 Server Action.
 *
 * 이메일/비밀번호 가입·로그인은 카카오·구글 OAuth 로 대체되었으므로 제거됨.
 * 로그인/회원가입 절차는 Supabase OAuth → `/auth/callback` 라우트에서 처리.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그아웃.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}
