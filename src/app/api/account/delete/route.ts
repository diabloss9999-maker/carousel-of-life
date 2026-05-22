/**
 * 계정 삭제 API.
 *
 * POST /api/account/delete
 *   body: { confirmEmail: string }
 *
 * 절차:
 * 1. 사용자 인증 확인
 * 2. confirmEmail 이 본인 이메일과 일치하는지 검증 (오삭제 방지)
 * 3. 활성 구독이 있으면 즉시 취소 (LS API / Toss flag)
 * 4. auth.users 행 삭제 → 모든 user_id FK 가 CASCADE 로 같이 삭제됨
 *    (profiles, fortunes, tarot_readings, subscriptions 등 전부)
 * 5. 세션 만료 → 클라이언트에서 로그인 페이지로 이동
 *
 * Google Play 데이터 안전 섹션 필수 — 사용자가 앱 내에서 직접 데이터 삭제 가능해야 함.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  confirmEmail: z.string().email(),
});

export async function POST(request: Request) {
  // 1. 인증
  const user = await requireUser();
  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: { code: API_ERROR_CODES.UNAUTHORIZED, message: "이메일이 없는 계정은 삭제할 수 없어요." } },
      { status: 401 },
    );
  }

  // 2. 본인 이메일 확인
  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: API_ERROR_CODES.VALIDATION_FAILED, message: "요청 형식이 올바르지 않아요." } },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: API_ERROR_CODES.VALIDATION_FAILED, message: "확인 이메일을 입력해 주세요." } },
      { status: 400 },
    );
  }
  if (parsed.data.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: { code: "EMAIL_MISMATCH", message: "입력한 이메일이 계정 이메일과 달라요." } },
      { status: 400 },
    );
  }

  // 3. 활성 구독 상태만 cancelled 로 flag — PortOne/Toss 모두 빌링키 자체가
  //    auth.users CASCADE 로 사라지므로 외부 API 호출 불필요.
  try {
    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        cancelAtPeriodEnd: true,
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.userId, user.id),
          inArray(subscriptions.status, ["active", "on_trial"]),
        ),
      );
  } catch (e) {
    console.error("[delete-account] subscription cancel error", e);
    // 구독 취소 실패해도 계정 삭제는 진행 (사용자가 명시적으로 요청한 경우)
  }

  // 4. auth.users 삭제 → 모든 FK CASCADE
  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[delete-account] supabase admin deleteUser failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DELETE_FAILED", message: "계정 삭제에 실패했어요. 잠시 후 다시 시도하거나 문의해 주세요." },
      },
      { status: 500 },
    );
  }

  // 5. 성공 응답 — 클라이언트가 sign-out 후 리다이렉트
  return NextResponse.json({ ok: true });
}
