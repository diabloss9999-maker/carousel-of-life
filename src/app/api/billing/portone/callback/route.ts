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
import { consumePendingBillingIssue } from "@/lib/payment/billing-issue";

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

  // issueId↔userId 바인딩 검증 — pending_billing_issues 에서 소비.
  // 다른 사용자가 내 카드로 구독 만드는 시나리오 차단.
  const consume = await consumePendingBillingIssue({
    issueId,
    userId: user.id,
  });
  if (!consume.ok) {
    return NextResponse.redirect(
      new URL(
        `/pricing?billingError=ISSUE_${consume.code}`,
        request.url,
      ),
    );
  }
  // 검증된 plan 으로 강제 (URL 의 plan 파라미터 위조 방지)
  const verifiedPlan = consume.plan;

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? null;
  const result = await createPortOneSubscription({
    userId: user.id,
    email: user.email,
    displayName,
    plan: verifiedPlan,
    issueId,
  });

  if (!result.ok) {
    // 이미 구독 중인 경우 — 결제창 진입 자체가 우회 흔적이므로 settings 로 안내
    if (result.code === "ALREADY_SUBSCRIBED") {
      return NextResponse.redirect(
        new URL("/settings?already=1", request.url),
      );
    }
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
