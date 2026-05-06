/**
 * Service Role 권한 Supabase 클라이언트.
 *
 * @remarks
 * - **반드시 서버에서만 사용**. 절대 클라이언트 번들에 포함되지 않도록 주의.
 * - RLS 를 우회하므로 웹훅, 배치 작업, 관리자 API 등 한정된 곳에만 사용.
 */
import "server-only";

import { createClient as createServiceClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv } from "@/lib/env";

let cached: ReturnType<typeof createServiceClient> | undefined;

/**
 * Service Role 클라이언트를 반환한다.
 *
 * @throws 환경변수가 설정되지 않은 경우.
 */
export function getSupabaseAdmin() {
  if (cached) return cached;

  const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase Admin 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 확인하세요.",
    );
  }

  cached = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}
