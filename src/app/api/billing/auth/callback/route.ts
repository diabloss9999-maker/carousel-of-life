/**
 * 토스 카드 인증 콜백.
 *
 * 토스 위젯이 인증 완료 후 이 URL 로 redirect:
 *   GET /api/billing/auth/callback?authKey=...&customerKey=...&plan=lite|pro
 *
 * 처리:
 *   1. authKey 로 영구 빌링키 발급
 *   2. 첫 달 결제 청구 (라이트 4,900 / 프로 9,900)
 *   3. subscription DB row 생성
 *   4. 사용자에게 성공/실패 페이지로 redirect
 *
 * 실패 시:
 *   GET /api/billing/auth/callback?code=...&message=...
 *   → /pricing?error=... 로 redirect
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireProfile } from "@/lib/auth/get-user";
import { siteConfig } from "@/config/site";
import {
  createTossSubscription,
  type TossPlan,
} from "@/lib/payment/toss-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlan(v: string | null): v is TossPlan {
  return v === "lite" || v === "pro";
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // 토스 인증 실패 시 — code + message 가 들어옴
  const failCode = sp.get("code");
  const failMessage = sp.get("message");
  if (failCode) {
    const url = new URL("/pricing", siteConfig.url);
    url.searchParams.set("billingError", failCode);
    if (failMessage) url.searchParams.set("billingMessage", failMessage);
    return NextResponse.redirect(url);
  }

  const authKey = sp.get("authKey");
  const customerKey = sp.get("customerKey");
  const plan = sp.get("plan");

  if (!authKey || !customerKey || !isPlan(plan)) {
    const url = new URL("/pricing", siteConfig.url);
    url.searchParams.set("billingError", "INVALID_CALLBACK");
    return NextResponse.redirect(url);
  }

  // 인증 통과 — customerKey 가 우리 사용자 ID 와 일치하는지 검증
  const { user, profile } = await requireProfile();
  const expectedCustomerKey = customerKey;
  // customerKey 는 클라이언트가 만들어 보내는 값 — 우리가 만든 customerKey 와
  // 동일한지 검증해 사용자 위조 방지.
  // (실무: 빌링 시작 시 서버가 customerKey 를 세션·DB 에 임시 저장하고 비교하는 게
  // 더 안전. 여기선 UUID 기반 deterministic 매핑 사용.)
  const userIdSlug = profile.userId.replace(/[^a-zA-Z0-9\-_*]/g, "_").slice(0, 50);
  if (expectedCustomerKey !== userIdSlug) {
    const url = new URL("/pricing", siteConfig.url);
    url.searchParams.set("billingError", "CUSTOMER_KEY_MISMATCH");
    return NextResponse.redirect(url);
  }

  const result = await createTossSubscription({
    userId: profile.userId,
    email: user.email ?? "",
    displayName: profile.displayName ?? null,
    plan,
    authKey,
    customerKey,
  });

  if (!result.ok) {
    const url = new URL("/pricing", siteConfig.url);
    url.searchParams.set("billingError", result.code);
    url.searchParams.set("billingMessage", result.message);
    return NextResponse.redirect(url);
  }

  // 성공 — 환영 페이지로
  const url = new URL("/today", siteConfig.url);
  url.searchParams.set("subscribed", "1");
  return NextResponse.redirect(url);
}
