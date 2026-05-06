/**
 * 브라우저에서 사용하는 Supabase 클라이언트.
 *
 * - 클라이언트 컴포넌트에서 사용.
 * - 익명 키만 노출하므로 RLS 가 반드시 활성화되어 있어야 함.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

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
