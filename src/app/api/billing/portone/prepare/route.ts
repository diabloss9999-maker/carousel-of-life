/**
 * PortOne 빌링키 발급 사전 준비 API.
 *
 * POST /api/billing/portone/prepare
 *   body: { plan: "lite" | "pro" }
 *   응답: { issueId }
 *
 * 기운:
 *   1. 인증 사용자만
 *   2. pending_billing_issues 에 issueId 등록 (15분 유효)
 *   3. issueId 반환 → 클라이언트가 PortOne SDK 호출 시 사용
 *   4. callback 에서 같은 issueId 가 들어오면 userId 검증 후 소비
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/get-user";
import { createPendingBillingIssue } from "@/lib/payment/billing-issue";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["lite", "pro"]),
});

export async function POST(request: Request) {
  const user = await requireUser();

  let parsed;
  try {
    const body = await request.json();
    parsed = schema.safeParse(body);
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
          message: "plan 은 lite 또는 pro 여야 해요.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const issueId = await createPendingBillingIssue({
      userId: user.id,
      plan: parsed.data.plan,
    });
    return NextResponse.json({ ok: true, data: { issueId } });
  } catch (e) {
    console.error("[billing/portone/prepare] failed", e);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: "결제 준비에 실패했어요. 잠시 후 다시 시도해 주세요.",
        },
      },
      { status: 500 },
    );
  }
}
