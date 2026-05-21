/**
 * PortOne 빌링키 발급 callback.
 *
 * GET /api/billing/portone/callback?plan=lite|pro&issueId=...
 *
 * 브라우저 SDK 의 `requestIssueBillingKey` 가 successUrl(=이 라우트)로
 * 리다이렉트하면서 issueId 를 전달. 여기서:
 *  1. issueId 로 PortOne API 에 빌링키 검증 요청
 *  2. 검증 성공 시 첫 청구 + DB 저장
 *  3. 성공 → /today?subscribed=1 / 실패 → /pricing?billingError=...
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/auth/get-user";
import { createPortOneSubscription } from "@/lib/payment/portone-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user.email) {
    return NextResponse.redirect(
      new URL("/pricing?billingError=NO_EMAIL", request.url),
    );
  }

  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");
  const issueId = url.searchParams.get("issueId");

  // PortOne 이 실패 시 code/message 를 query 로 전달
  const errorCode = url.searchParams.get("code");
  const errorMsg = url.searchParams.get("message");
  if (errorCode) {
    return NextResponse.redirect(
      new URL(
        `/pricing?billingError=${encodeURIComponent(errorCode)}&billingMsg=${encodeURIComponent(errorMsg ?? "")}`,
        request.url,
      ),
    );
  }

  if (!plan || (plan !== "lite" && plan !== "pro")) {
    return NextResponse.redirect(
      new URL("/pricing?billingError=INVALID_PLAN", request.url),
    );
  }
  if (!issueId) {
    return NextResponse.redirect(
      new URL("/pricing?billingError=NO_ISSUE_ID", request.url),
    );
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? null;
  const result = await createPortOneSubscription({
    userId: user.id,
    email: user.email,
    displayName,
    plan,
    issueId,
  });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/pricing?billingError=${encodeURIComponent(result.code)}&billingMsg=${encodeURIComponent(result.message)}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/today?subscribed=1", request.url),
  );
}
