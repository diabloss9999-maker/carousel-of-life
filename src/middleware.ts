/**
 * Next.js 미들웨어 — 미러 도메인을 canonical URL로 리다이렉트.
 *
 * Vercel은 같은 프로젝트에 여러 alias URL 을 자동 부여 (e.g. *-k5hs.vercel.app).
 * SEO 분산 / 쿠키 분기 방지를 위해 canonical 외 호스트는 301 리다이렉트.
 */
import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "carousel-of-life.vercel.app";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // localhost / preview / canonical은 통과
  if (
    host === CANONICAL_HOST ||
    host.startsWith("localhost") ||
    host.endsWith(".local")
  ) {
    return NextResponse.next();
  }

  // 다른 *.vercel.app 별칭으로 들어왔으면 canonical로 301 redirect
  if (host.endsWith(".vercel.app")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  // 정적 자산·이미지 최적화·favicon 제외, 나머지 모든 경로
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)"],
};
