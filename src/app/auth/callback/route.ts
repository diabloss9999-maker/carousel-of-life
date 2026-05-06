/**
 * Supabase Auth 이메일 인증·OAuth 콜백.
 *
 * `code` 쿼리 파라미터를 세션으로 교환하고 `next` 또는 /today 로 이동.
 */
import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? ROUTES.onboarding;

  if (!code) {
    return NextResponse.redirect(new URL(ROUTES.login, url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failUrl = new URL(ROUTES.login, url.origin);
    failUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(failUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
