/**
 * 별조각 충전 결제 검증 + 충전.
 *
 * POST /api/currency/confirm   body: { paymentId, packId }
 *   — 결제창 popup/iframe 모드에서 클라이언트가 직접 호출.
 *
 * GET  /api/currency/confirm?paymentId=&packId=&returnTo=
 *   — 모바일 redirect 모드에서 PortOne 이 리디렉트하는 콜백.
 *     처리 후 returnTo(기본 /chat)로 ?topup=ok|fail 쿼리와 함께 이동.
 *
 * 검증 절차 (서버):
 *   1. PortOne 단건 조회 — status === "PAID"
 *   2. 금액 일치 — amount.total === pack.priceKRW
 *   3. 고객 일치 — customer.id === userIdToCustomerId(로그인 유저)
 *   4. 멱등 충전 — 같은 paymentId 재호출 시 중복 충전 없음
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { getPack } from "@/lib/gifts/catalog";
import { creditPurchase } from "@/lib/gifts/service";
import {
  fetchPayment,
  userIdToCustomerId,
  PortOneError,
} from "@/lib/payment/portone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  paymentId: z.string().min(8).max(120),
  packId: z.string().min(1).max(40),
});

interface VerifyResult {
  ok: boolean;
  status: number;
  message: string;
  balance?: number;
}

async function verifyAndCredit(
  userId: string,
  paymentId: string,
  packId: string,
): Promise<VerifyResult> {
  const pack = getPack(packId);
  if (!pack) {
    return { ok: false, status: 400, message: "알 수 없는 충전 상품이에요." };
  }

  let payment;
  try {
    payment = await fetchPayment(paymentId);
  } catch (e) {
    const status = e instanceof PortOneError && e.status === 404 ? 404 : 502;
    return { ok: false, status, message: "결제 내역을 확인하지 못했어요." };
  }

  if (payment.status !== "PAID") {
    return { ok: false, status: 409, message: "아직 결제가 완료되지 않았어요." };
  }
  if ((payment.amount?.total ?? -1) !== pack.priceKRW) {
    return { ok: false, status: 409, message: "결제 금액이 일치하지 않아요." };
  }
  if (payment.customer?.id && payment.customer.id !== userIdToCustomerId(userId)) {
    return { ok: false, status: 403, message: "본인 결제만 충전할 수 있어요." };
  }

  const { balance } = await creditPurchase(userId, packId, paymentId);
  return { ok: true, status: 200, message: "충전 완료", balance };
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "요청을 해석하지 못했어요." } },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { message: "요청 값이 올바르지 않아요." } },
      { status: 400 },
    );
  }

  const { profile } = await requireProfile();
  const result = await verifyAndCredit(
    profile.userId,
    parsed.data.paymentId,
    parsed.data.packId,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: { message: result.message } },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true, data: { balance: result.balance } });
}

/** redirect 모드 콜백 — 처리 후 사용자 화면으로 복귀. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const paymentId = sp.get("paymentId") ?? "";
  const packId = sp.get("packId") ?? "";
  // returnTo 는 내부 경로만 허용 (open redirect 방지).
  const rawReturnTo = sp.get("returnTo") ?? "/chat";
  const returnTo = rawReturnTo.startsWith("/") ? rawReturnTo : "/chat";

  const redirect = (result: "ok" | "fail") => {
    const url = new URL(returnTo, req.nextUrl.origin);
    url.searchParams.set("topup", result);
    return NextResponse.redirect(url);
  };

  // PortOne 이 실패 시 code/message 쿼리를 붙여 보낸다.
  if (sp.get("code")) return redirect("fail");
  if (!paymentId || !packId) return redirect("fail");

  try {
    const { profile } = await requireProfile();
    const result = await verifyAndCredit(profile.userId, paymentId, packId);
    return redirect(result.ok ? "ok" : "fail");
  } catch {
    return redirect("fail");
  }
}
