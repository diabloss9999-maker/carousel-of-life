/**
 * Server Component / Route Handler 에서 사용하는 Supabase 클라이언트.
 */
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv } from "@/lib/env";

export async function createClient() {
  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 을 확인하세요.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 에서는 쿠키 설정이 불가능하다.
            // 이 분기는 Server Action / Route Handler 가 아닌 경우 발생하며 무시해도 안전하다.
          }
        },
      },
    },
  );
}
