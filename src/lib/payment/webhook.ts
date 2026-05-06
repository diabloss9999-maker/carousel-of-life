/**
 * Lemon Squeezy webhook 처리.
 *
 * - HMAC-SHA256 서명 검증 (timing-safe)
 * - 멱등성 보장 (webhook_events 테이블)
 * - 이벤트별 핸들러 분기
 */
import "server-only";

import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { purchases, subscriptions, webhookEvents } from "@/db/schema";
import { serverEnv } from "@/lib/env";
import type { SubscriptionStatus } from "@/types";

const PROVIDER = "lemonsqueezy";

/**
 * webhook 서명 검증 (timing-safe HMAC-SHA256).
 *
 * @returns 검증 성공 여부
 */
export function verifySignature(rawBody: string, signature: string): boolean {
  const secret = serverEnv.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET 가 설정되지 않았어요.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature ?? "", "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string } | null;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

/**
 * webhook event 를 처리한다.
 *
 * - 멱등 키: (provider, event_id) UNIQUE
 * - 이미 처리된 이벤트는 즉시 OK 반환
 *
 * event_id 는 LS 헤더 `X-Event-Id` 또는 payload 의 `meta` + `data.id` 조합.
 */
export async function processWebhook(opts: {
  eventId: string;
  payload: WebhookPayload;
  raw: string;
}): Promise<{ ok: true; deduped: boolean } | { ok: false; error: string }> {
  const { eventId, payload } = opts;
  const eventName = payload.meta?.event_name;
  if (!eventName) {
    return { ok: false, error: "event_name 이 없어요." };
  }

  // 멱등 처리: 이미 받은 이벤트면 skip.
  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: PROVIDER,
      eventId,
      eventName,
      raw: payload as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({
      target: [webhookEvents.provider, webhookEvents.eventId],
    })
    .returning({ id: webhookEvents.id });

  if (inserted.length === 0) {
    return { ok: true, deduped: true };
  }

  const recordId = inserted[0].id;

  try {
    if (eventName.startsWith("subscription_")) {
      await handleSubscriptionEvent(payload);
    } else if (eventName.startsWith("order_")) {
      await handleOrderEvent(payload);
    }

    await db
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.id, recordId));

    return { ok: true, deduped: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    await db
      .update(webhookEvents)
      .set({ error: message })
      .where(eq(webhookEvents.id, recordId));
    return { ok: false, error: message };
  }
}

// =============================================================================
// 이벤트별 핸들러
// =============================================================================

interface SubscriptionAttrs {
  user_email?: string;
  customer_id?: number | string;
  product_id?: number | string;
  variant_id?: number | string;
  status?: string;
  cancelled?: boolean;
  trial_ends_at?: string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

async function handleSubscriptionEvent(payload: WebhookPayload) {
  const userId = payload.meta.custom_data?.user_id;
  if (!userId) {
    throw new Error(
      "subscription event 에 custom_data.user_id 가 없어요. checkout 생성 시 주입 필요.",
    );
  }

  const lsSubscriptionId = payload.data.id;
  const attrs = payload.data.attributes as SubscriptionAttrs;

  const status = mapSubscriptionStatus(attrs.status, attrs.cancelled);

  await db
    .insert(subscriptions)
    .values({
      userId,
      lsSubscriptionId,
      lsCustomerId: String(attrs.customer_id ?? ""),
      lsVariantId: String(attrs.variant_id ?? ""),
      status,
      currentPeriodStartsAt: attrs.created_at
        ? new Date(attrs.created_at)
        : null,
      currentPeriodEndsAt: attrs.renews_at
        ? new Date(attrs.renews_at)
        : attrs.ends_at
          ? new Date(attrs.ends_at)
          : null,
      cancelAtPeriodEnd: Boolean(attrs.cancelled),
      endedAt:
        status === "expired" || status === "cancelled"
          ? attrs.ends_at
            ? new Date(attrs.ends_at)
            : new Date()
          : null,
      raw: payload as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: subscriptions.lsSubscriptionId,
      set: {
        status,
        currentPeriodStartsAt: attrs.created_at
          ? new Date(attrs.created_at)
          : null,
        currentPeriodEndsAt: attrs.renews_at
          ? new Date(attrs.renews_at)
          : attrs.ends_at
            ? new Date(attrs.ends_at)
            : null,
        cancelAtPeriodEnd: Boolean(attrs.cancelled),
        endedAt:
          status === "expired" || status === "cancelled"
            ? attrs.ends_at
              ? new Date(attrs.ends_at)
              : new Date()
            : null,
        raw: payload as unknown as Record<string, unknown>,
      },
    });
}

interface OrderAttrs {
  user_email?: string;
  total?: number;
  refunded?: boolean;
  status?: string;
  first_order_item?: {
    product_id?: number | string;
    variant_id?: number | string;
    product_name?: string;
  };
}

async function handleOrderEvent(payload: WebhookPayload) {
  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;
  if (!userId) return; // order 일부는 사용자 식별 불가 (구독 갱신 등) — 무시 OK

  const lsOrderId = payload.data.id;
  const attrs = payload.data.attributes as OrderAttrs;

  // 단건 결제 (one-time product) 만 purchases 테이블에 기록.
  // 구독 결제는 subscriptions 으로 충분.
  const productName = attrs.first_order_item?.product_name ?? "unknown";
  const status: "paid" | "refunded" | "failed" =
    eventName === "order_refunded" || attrs.refunded
      ? "refunded"
      : attrs.status === "paid"
        ? "paid"
        : "failed";

  await db
    .insert(purchases)
    .values({
      userId,
      lsOrderId,
      productKey: productName,
      amount: Math.round(attrs.total ?? 0),
      status,
      raw: payload as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: purchases.lsOrderId,
      set: {
        status,
        raw: payload as unknown as Record<string, unknown>,
      },
    });
}

function mapSubscriptionStatus(
  raw: string | undefined,
  cancelled: boolean | undefined,
): SubscriptionStatus {
  switch (raw) {
    case "active":
      return cancelled ? "active" : "active";
    case "on_trial":
      return "on_trial";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    case "expired":
    case "unpaid":
      return "expired";
    default:
      return "expired";
  }
}
