import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/get-user";
import { verifyGooglePlayPurchase } from "@/lib/payment/google-play";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["lite", "pro"]),
  productId: z.string().min(1),
  purchaseToken: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await requireUser();

  let parsed;
  try {
    parsed = schema.safeParse(await request.json());
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "요청 형식이 올바르지 않아요.",
        },
      },
      { status: 400 },
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "Google Play 구매 정보가 부족해요.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await verifyGooglePlayPurchase({
      userId: user.id,
      ...parsed.data,
    });
    if (!result.ok) {
      const status =
        result.code === "GOOGLE_PLAY_NOT_CONFIGURED" ? 503 : 400;
      return NextResponse.json(
        {
          ok: false,
          error: { code: result.code, message: result.message },
        },
        { status },
      );
    }

    return NextResponse.json({ ok: true, data: { plan: result.plan } });
  } catch (e) {
    console.error("[billing/google-play/verify] failed", e);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message:
            "Google Play 구독 확인 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 },
    );
  }
}
