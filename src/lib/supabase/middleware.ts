import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/lib/constants";
import { clientEnv } from "@/lib/env";

const PROTECTED_PREFIXES = [
  "/admin",
  "/album",
  "/archive",
  "/chat",
  "/collection",
  "/compatibility",
  "/dream",
  "/flower-oracle",
  "/group",
  "/home",
  "/monthly",
  "/name-compatibility",
  "/name-reading",
  "/onboarding",
  "/palm",
  "/personality",
  "/saju",
  "/settings",
  "/tarot",
  "/today",
  "/weekly",
  "/yearly",
];

const AUTH_ONLY_PREFIXES = [ROUTES.login, ROUTES.signup];
const PLATFORM_COOKIE = "col_platform";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function getPlatformFromRequest(request: NextRequest): "android" | "ios" | null {
  const fromQuery = request.nextUrl.searchParams.get("appPlatform");
  if (fromQuery === "android" || fromQuery === "ios") return fromQuery;

  const fromCookie = request.cookies.get(PLATFORM_COOKIE)?.value;
  if (fromCookie === "android" || fromCookie === "ios") return fromCookie;

  const referer = request.headers.get("referer") ?? "";
  if (referer.startsWith("android-app://com.leonardocode.carouseloflife")) {
    return "android";
  }

  return null;
}

function persistPlatform(response: NextResponse, platform: "android" | "ios" | null) {
  if (!platform) return response;
  response.cookies.set(PLATFORM_COOKIE, platform, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const appPlatform = getPlatformFromRequest(request);
  if (appPlatform) {
    request.cookies.set(PLATFORM_COOKIE, appPlatform);
  }

  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
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
    return persistPlatform(NextResponse.redirect(url), appPlatform);
  }

  if (isAuthOnly && user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.appHome;
    return persistPlatform(NextResponse.redirect(url), appPlatform);
  }

  return persistPlatform(supabaseResponse, appPlatform);
}
