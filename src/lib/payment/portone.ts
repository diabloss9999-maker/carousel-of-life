/**
 * PortOne (포트원) V2 REST API 래퍼.
 *
 * 공식 SDK 가 Node 환경 빌더 의존성 무거워서 fetch 로 얇게 래핑.
 *
 * 인증: `Authorization: PortOne {API_SECRET}` 헤더
 * BASE: https://api.portone.io
 *
 * 사용처:
 *  - 빌링키 발급 검증 (issueId 로 결과 조회)
 *  - 자동결제 청구 (billingKey 로 결제)
 *  - 결제 단건 조회 / 환불
 *  - 빌링키 삭제
 */
import "server-only";

import { serverEnv } from "@/lib/env";

const API_BASE = "https://api.portone.io";

export class PortOneError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "PortOneError";
  }
}

function authHeader(): string {
  const secret = serverEnv.PORTONE_API_SECRET;
  if (!secret) {
    throw new PortOneError("PORTONE_API_SECRET 환경변수가 설정되지 않음");
  }
  return `PortOne ${secret}`;
}

async function call<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const errMsg =
      (body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : null) ?? `PortOne API ${res.status}`;
    const errCode =
      body && typeof body === "object" && "type" in body
        ? String((body as { type: unknown }).type)
        : undefined;
    throw new PortOneError(errMsg, res.status, errCode, body);
  }

  return body as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

export interface PortOneBillingKey {
  billingKey: string;
  channelKey?: string;
  customer?: {
    id?: string;
    name?: { full?: string };
    email?: string;
  };
  card?: {
    company?: string;
    name?: string;
    number?: string; // 마스킹된 번호
    type?: string;
  };
  status: "ISSUED" | "DELETED" | "FAILED";
  issuedAt?: string;
  deletedAt?: string;
}

export interface PortOnePayment {
  id: string;
  status:
    | "READY"
    | "PENDING"
    | "VIRTUAL_ACCOUNT_ISSUED"
    | "PAID"
    | "FAILED"
    | "PARTIAL_CANCELLED"
    | "CANCELLED";
  amount?: { total: number };
  currency?: "KRW";
  customer?: { id?: string };
  method?: { type?: string };
  paidAt?: string;
  pgProvider?: string;
  pgTxId?: string;
  cancellation?: {
    cancelledAt?: string;
    reason?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 빌링키 / 결제 API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 빌링키 발급 결과 조회 — 브라우저 SDK 에서 발급된 issueId 로 검증.
 * V2: GET /billing-keys/{billingKey}  또는  GET /issued-billing-keys/{issueId}
 */
export async function getBillingKeyByIssueId(
  issueId: string,
): Promise<PortOneBillingKey> {
  return call<PortOneBillingKey>(
    `/billing-keys/issue/${encodeURIComponent(issueId)}`,
  );
}

/**
 * 빌링키 정보 조회.
 */
export async function getBillingKey(
  billingKey: string,
): Promise<PortOneBillingKey> {
  return call<PortOneBillingKey>(
    `/billing-keys/${encodeURIComponent(billingKey)}`,
  );
}

/**
 * 빌링키 삭제 (구독 취소 + 카드 정보 폐기).
 */
export async function deleteBillingKey(billingKey: string): Promise<void> {
  await call(`/billing-keys/${encodeURIComponent(billingKey)}`, {
    method: "DELETE",
  });
}

/**
 * 빌링키로 자동결제 청구.
 *
 * paymentId 는 우리가 생성한 고유 ID — 멱등성 보장 (같은 ID 재호출 시 중복 청구 X).
 */
export async function chargeWithBillingKey(opts: {
  paymentId: string;
  billingKey: string;
  orderName: string;
  amountKRW: number;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
}): Promise<PortOnePayment> {
  return call<PortOnePayment>(
    `/payments/${encodeURIComponent(opts.paymentId)}/billing-key`,
    {
      method: "POST",
      body: JSON.stringify({
        billingKey: opts.billingKey,
        orderName: opts.orderName,
        amount: { total: opts.amountKRW },
        currency: "KRW",
        ...(opts.customer
          ? {
              customer: {
                ...(opts.customer.id ? { id: opts.customer.id } : {}),
                ...(opts.customer.name
                  ? { name: { full: opts.customer.name } }
                  : {}),
                ...(opts.customer.email ? { email: opts.customer.email } : {}),
              },
            }
          : {}),
      }),
    },
  );
}

/**
 * 결제 단건 조회.
 */
export async function fetchPayment(paymentId: string): Promise<PortOnePayment> {
  return call<PortOnePayment>(
    `/payments/${encodeURIComponent(paymentId)}`,
  );
}

/**
 * 결제 취소·환불.
 */
export async function cancelPayment(opts: {
  paymentId: string;
  amountKRW?: number;
  reason: string;
}): Promise<PortOnePayment> {
  return call<PortOnePayment>(
    `/payments/${encodeURIComponent(opts.paymentId)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: opts.reason,
        ...(opts.amountKRW != null
          ? { amount: { total: opts.amountKRW } }
          : {}),
      }),
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ID 생성 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PortOne issueId / paymentId / orderId 생성 — 충돌 회피용 prefix + uuid.
 */
export function buildBillingIssueId(userId: string): string {
  return `bill-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildPaymentId(userId: string): string {
  return `pay-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildOrderId(userId: string, plan: "lite" | "pro"): string {
  return `order-${plan}-${userId.slice(0, 8)}-${Date.now()}`;
}

/**
 * 고객 ID 생성 — userId 를 URL-safe slug 로 변환.
 */
export function userIdToCustomerId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 32);
}
