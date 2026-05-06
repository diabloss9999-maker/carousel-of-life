/**
 * Next.js 글로벌 프록시 (구 middleware).
 *
 * Next.js 16 부터 파일명이 `middleware` → `proxy` 로, export 이름도
 * `middleware` → `proxy` 로 변경되었다.
 *
 * - Supabase 세션 갱신
 * - 보호된 라우트 접근 제어
 */
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
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
