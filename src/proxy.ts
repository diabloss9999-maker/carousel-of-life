/**
 * Next.js 글로벌 프록시 (구 middleware).
 *
 * Next.js 16 부터 파일명이 `middleware` → `proxy` 로, export 이름도
 * `middleware` → `proxy` 로 변경되었다.
 *
 * 책임:
 * - 미러 도메인을 canonical URL 로 301 리다이렉트 (SEO 분산 방지)
 * - Supabase 세션 갱신
 * - 보호된 라우트 접근 제어
 */
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "carouseloflife.com";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // 비-canonical 호스트로 들어왔으면 canonical 로 301 redirect.
  // 대상: 모든 *.vercel.app 별칭 + www.{CANONICAL_HOST} 서브도메인.
  // localhost / *.local / canonical 호스트는 통과.
  if (
    host !== CANONICAL_HOST &&
    !host.startsWith("localhost") &&
    !host.endsWith(".local") &&
    (host.endsWith(".vercel.app") || host === `www.${CANONICAL_HOST}`)
  ) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 프록시를 적용:
     * - _next/static (정적 자산)
     * - _next/image  (이미지 최적화)
     * - favicon.ico, robots.txt, sitemap.xml
     * - 공용 정적 파일 (확장자 포함된 모든 요청)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
