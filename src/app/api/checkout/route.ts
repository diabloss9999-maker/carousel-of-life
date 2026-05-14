/**
 * Checkout URL 생성 API.
 *
 * GET /api/checkout
 *  → Lemon Squeezy 결제 페이지로 redirect
 *
 * 인증된 사용자만 호출 가능. user_id 가 custom_data 로 전달됨.
 */
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/auth/get-user";
import { clientEnv } from "@/lib/env";
import { createSubscriptionCheckout } from "@/lib/payment/lemonsqueezy";
import { ROUTES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const tErr = await getTranslations("actionErrors");

  if (!user.email) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NO_EMAIL",
          message: tErr("checkoutEmailRequired"),
        },
      },
      { status: 400 },
    );
  }

  try {
    const url = await createSubscriptionCheckout({
      userId: user.id,
      email: user.email,
      displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
      redirectAfter: `${clientEnv.NEXT_PUBLIC_APP_URL}${ROUTES.settings}?subscribed=1`,
    });

    return NextResponse.redirect(url, 303);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CHECKOUT_FAILED",
          message: e instanceof Error ? e.message : tErr("checkoutCreationFailed"),
        },
      },
      { status: 500 },
    );
  }
}
