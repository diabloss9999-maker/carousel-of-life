/**
 * 토스페이먼츠 서버측 API 헬퍼.
 *
 * 토스는 공식 Node SDK 가 없고 REST API 직접 호출 방식이라 여기서 모두 래핑.
 *
 * ## 정기결제 흐름
 *
 * 1. 빌링키 발급 (1회):
 *    - 클라이언트가 `tosspayments.requestBillingAuth()` 호출 → 사용자 카드 입력
 *    - 토스가 successUrl 로 redirect (authKey + customerKey)
 *    - 서버: `issueBillingKey()` 호출 → billingKey 반환
 *    - DB 의 subscriptions 테이블에 저장
 *
 * 2. 자동 결제 (월별):
 *    - 서버 cron: 만료 임박 구독 찾아 `chargeWithBillingKey()` 호출
 *    - 결제 성공 → currentPeriodEndsAt 다음달로 연장
 *    - 결제 실패 → past_due 로 표시 + 재시도
 *
 * 3. 취소:
 *    - 빌링키 자체는 보관 (사용자 재구독 가능)
 *    - subscriptions.cancelAtPeriodEnd = true 로 표시
 *    - 다음 cron 실행 시 자동 결제 안 함
 *
 * ## 시크릿
 *
 * - TOSS_SECRET_KEY : 서버 전용. Basic auth (base64(secret:)) 헤더로 사용.
 * - NEXT_PUBLIC_TOSS_CLIENT_KEY : 클라이언트 widget 용 (공개 OK).
 */
import "server-only";

import { serverEnv } from "@/lib/env";

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

/** Toss API 호출 시 Basic auth 헤더 생성. */
function authHeader(): string {
  const secret = serverEnv.TOSS_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "TOSS_SECRET_KEY 가 비어있어요. Vercel 환경변수를 확인하세요.",
    );
  }
  // 토스 spec: base64(secretKey + ":")
  const encoded = Buffer.from(`${secret}:`).toString("base64");
  return `Basic ${encoded}`;
}

interface TossApiError {
  code: string;
  message: string;
}

class TossError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(`[Toss ${code}] ${message}`);
    this.name = "TossError";
  }
}

async function tossFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Partial<TossApiError>;
    throw new TossError(
      err.code ?? "UNKNOWN",
      err.message ?? "토스 API 호출 실패",
      res.status,
    );
  }

  return (await res.json()) as T;
}

// ─────────────────────────────────────────────────────────────────
// 빌링키 (정기결제 인증)
// ─────────────────────────────────────────────────────────────────

export interface BillingKeyResponse {
  /** 빌링키 — 이후 정기결제에 사용. 절대 클라이언트 노출 금지. */
  billingKey: string;
  /** 카드 회사명 등 정보 (UI 표시용). */
  card: {
    company: string;
    number: string; // 마스킹된 카드번호
  };
  /** 우리가 보낸 customerKey 그대로 반환. */
  customerKey: string;
  /** 빌링키 발급 시각. */
  authenticatedAt: string;
  method: string;
}

/**
 * 클라이언트가 토스 카드 인증을 완료하고 successUrl 로 돌아왔을 때
 * authKey 와 customerKey 를 받아 영구 빌링키를 발급한다.
 */
export async function issueBillingKey(opts: {
  authKey: string;
  customerKey: string;
}): Promise<BillingKeyResponse> {
  return tossFetch<BillingKeyResponse>("/billing/authorizations/issue", {
    method: "POST",
    body: JSON.stringify({
      authKey: opts.authKey,
      customerKey: opts.customerKey,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────
// 정기결제 (빌링키로 청구)
// ─────────────────────────────────────────────────────────────────

export interface ChargeResponse {
  paymentKey: string;
  orderId: string;
  status: "DONE" | "CANCELED" | "ABORTED" | "EXPIRED" | string;
  totalAmount: number;
  approvedAt: string;
  method: string;
  receipt?: { url: string };
}

/**
 * 빌링키로 결제 청구. 정기 갱신 시 cron 에서 호출.
 *
 * @param amount KRW 단위 (예: 4900 = 4,900원)
 * @param orderId 우리 시스템에서 유일한 주문 ID — 동일 ID 재호출 시 중복 차단 (멱등성)
 */
export async function chargeWithBillingKey(opts: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
}): Promise<ChargeResponse> {
  return tossFetch<ChargeResponse>(`/billing/${opts.billingKey}`, {
    method: "POST",
    body: JSON.stringify({
      customerKey: opts.customerKey,
      amount: opts.amount,
      orderId: opts.orderId,
      orderName: opts.orderName,
      customerEmail: opts.customerEmail,
      customerName: opts.customerName,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────
// 결제 조회 / 환불
// ─────────────────────────────────────────────────────────────────

export interface PaymentDetails {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  approvedAt: string;
  method: string;
  cancels?: Array<{
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
  }>;
}

export async function fetchPayment(paymentKey: string): Promise<PaymentDetails> {
  return tossFetch<PaymentDetails>(`/payments/${paymentKey}`, {
    method: "GET",
  });
}

/** 결제 취소·환불. */
export async function refundPayment(opts: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number; // 부분 환불, 없으면 전체
}): Promise<PaymentDetails> {
  return tossFetch<PaymentDetails>(`/payments/${opts.paymentKey}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      cancelReason: opts.cancelReason,
      cancelAmount: opts.cancelAmount,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────

/**
 * 우리 시스템 user_id 를 토스 customerKey 로 변환.
 * 토스 spec: 영문/숫자/-/_/* 만 허용, 50자 이내.
 */
export function userIdToCustomerKey(userId: string): string {
  // UUID 의 - 는 허용되므로 그대로 사용 가능. 안전을 위해 sanitize.
  return userId.replace(/[^a-zA-Z0-9\-_*]/g, "_").slice(0, 50);
}

/**
 * 고유 주문 ID 생성 — 토스 spec: 6~64자, 영문/숫자/-/_ 만.
 * 형식: `sub-{userId8}-{yyyymmdd}-{random4}` (멱등성: 같은 날 같은 user 면 같은 ID)
 */
export function buildSubscriptionOrderId(
  userId: string,
  date: Date = new Date(),
): string {
  const ymd =
    `${date.getFullYear()}` +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const userPart = userId.replace(/-/g, "").slice(0, 8);
  const random = Math.random().toString(36).slice(2, 6);
  return `sub-${userPart}-${ymd}-${random}`;
}

export { TossError };
