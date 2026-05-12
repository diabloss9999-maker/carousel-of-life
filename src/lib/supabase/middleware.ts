/**
 * Next.js 미들웨어용 Supabase 세션 갱신 헬퍼.
 *
 * 매 요청마다 세션 쿠키를 새로 설정해 만료를 방지한다.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/lib/constants";
import { clientEnv } from "@/lib/env";

const PROTECTED_PREFIXES = [
  ROUTES.today,
  ROUTES.chat,
  ROUTES.tarot,
  ROUTES.saju,
  ROUTES.compatibility,
  ROUTES.settings,
  ROUTES.onboarding,
];

const AUTH_ONLY_PREFIXES = [ROUTES.login, ROUTES.signup];

/**
 * 세션을 갱신하고 인증 보호 라우트를 처리한다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // 환경변수가 없으면 미들웨어가 앱 전체를 막아버리지 않도록 그대로 통과시킨다.
    return supabaseResponse;
  }

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.chat;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
