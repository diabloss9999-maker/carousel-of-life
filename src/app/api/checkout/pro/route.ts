/**
 * 프로 플랜 Checkout URL 생성 API.
 *
 * GET /api/checkout/pro
 *  → Lemon Squeezy 프로 결제 페이지로 redirect
 */
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/get-user";
import { clientEnv } from "@/lib/env";
import { createProSubscriptionCheckout } from "@/lib/payment/lemonsqueezy";
import { ROUTES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();

  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: { code: "NO_EMAIL", message: "구독을 시작하려면 이메일이 필요해요." } },
      { status: 400 },
    );
  }

  try {
    const url = await createProSubscriptionCheckout({
      userId: user.id,
      email: user.email,
      displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
      redirectAfter: `${clientEnv.NEXT_PUBLIC_APP_URL}${ROUTES.settings}?subscribed=1`,
    });

    return NextResponse.redirect(url, 303);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: { code: "CHECKOUT_FAILED", message: e instanceof Error ? e.message : "결제 페이지 생성 실패" } },
      { status: 500 },
    );
  }
}
