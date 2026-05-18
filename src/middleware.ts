/**
 * 글로벌 미들웨어 — CSRF 보호.
 *
 * state-changing HTTP 메서드 (POST/PUT/PATCH/DELETE) 가 /api/* 로 올 때
 * Origin 헤더를 검사해 허용된 사이트에서 온 요청만 통과시킨다.
 *
 * 예외:
 *   - /api/webhooks/*  — 외부(Lemon Squeezy 등) 가 호출하는 webhook. 자체 HMAC 검증 사용.
 *
 * Supabase 세션 갱신은 page Server Component 가 createServerClient 호출 시
 * 매번 처리하므로 미들웨어 레벨 처리 없음.
 */
import { NextResponse, type NextRequest } from "next/server";

import { siteConfig } from "@/config/site";

/** 허용된 출처. siteConfig.url 과 www / 로컬 dev. */
function getAllowedOrigins(): Set<string> {
  const set = new Set<string>([
    siteConfig.url,                 // https://carouseloflife.com
    siteConfig.url.replace("://", "://www."), // https://www.carouseloflife.com
  ]);
  if (process.env.NODE_ENV !== "production") {
    set.add("http://localhost:3000");
    set.add("http://127.0.0.1:3000");
  }
  return set;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 미들웨어 매처가 이미 /api/* 만 잡지만 webhook 은 통과시킨다.
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  if (!MUTATING_METHODS.has(req.method)) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin");
  // 같은 origin 에서 fetch 호출은 origin 헤더가 없거나 동일하다.
  // 브라우저 외 직접 호출(서버→서버) 은 origin 이 없을 수 있는데,
  // 그런 케이스는 라우트 내부의 auth 가 막는다. CSRF 만 차단 목적.
  if (origin) {
    const allowed = getAllowedOrigins();
    if (!allowed.has(origin)) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: invalid origin" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // /api/* 모든 라우트에만 적용 (정적 자산·페이지 영향 0).
  matcher: ["/api/:path*"],
};
