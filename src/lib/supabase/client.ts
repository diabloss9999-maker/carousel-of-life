/**
 * 브라우저에서 사용하는 Supabase 클라이언트.
 *
 * - 클라이언트 컴포넌트에서 사용.
 * - 익명 키만 노출하므로 RLS 가 반드시 활성화되어 있어야 함.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";
import { ROUTES } from "@/lib/constants";

export function createClient() {
  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 을 확인하세요.",
    );
  }

  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * 카카오 OAuth 로그인을 시작한다.
 *
 * Supabase Auth 의 `signInWithOAuth` 를 호출해 카카오 인증 페이지로 리다이렉트한다.
 * 인증 완료 후에는 `/auth/callback` 라우트가 세션을 교환한다.
 *
 * scope 는 `profile_nickname profile_image` 만 요청한다.
 * `account_email` 은 카카오 비즈앱 검수 통과 후에만 사용 가능하므로 제외 (KOE205 방지).
 *
 * @returns Supabase OAuth 응답 (data.url 로 리다이렉트되거나 error 가 있음)
 */
export async function signInWithKakao() {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}${ROUTES.authCallback}`,
      scopes: "profile_nickname profile_image",
    },
  });
}

/**
 * 구글 OAuth 로그인을 시작한다.
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${ROUTES.authCallback}`,
    },
  });
}
