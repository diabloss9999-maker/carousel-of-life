/**
 * 웹 푸시 알림 발송 service.
 *
 * - VAPID 인증으로 브라우저 푸시 서비스(FCM·APNS·Mozilla)에 알림 전송.
 * - 4xx (410 Gone, 404 Not Found) 응답은 endpoint 가 무효라는 신호 → DB 에서 자동 제거.
 * - 5xx / 네트워크 에러는 errorCount 증가, 임계치 초과 시 정리.
 *
 * 호출자:
 *   1. cron (매일 운세 알림)
 *   2. 향후 일회성 알림 (결제 완료, 친구 초대 수락 등)
 */
import "server-only";

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { serverEnv, clientEnv } from "@/lib/env";

/** errorCount 가 이 값 이상이면 endpoint 를 무효로 간주하고 삭제. */
const MAX_ERROR_COUNT = 5;

/** 410/404 — endpoint 가 영구 무효. */
const PERMANENT_FAILURE_STATUS = new Set([404, 410]);

let initialized = false;

function initWebPush(): void {
  if (initialized) return;
  const publicKey = clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = serverEnv.VAPID_PRIVATE_KEY;
  const subject = serverEnv.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID 키가 설정되지 않았습니다. NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT 확인 필요.",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** 알림 클릭 시 이동 경로 (앱 내부 경로). */
  url?: string;
  /** 같은 tag 의 알림은 묶여서 1개만 표시. */
  tag?: string;
  /** 새 알림으로 기존 알림 대체. */
  renotify?: boolean;
  /** 알림 아이콘 (멤버 사진 등). 미지정 시 sw 기본 아이콘. */
  icon?: string;
  /** 알림 큰 이미지 (Android — 본문 아래 히어로 이미지). */
  image?: string;
}

interface SendResult {
  ok: boolean;
  /** 영구 실패 (404/410) → endpoint 삭제됨. */
  gone?: boolean;
  /** 일시 실패 — errorCount 증가됨. */
  retriable?: boolean;
  statusCode?: number;
  message?: string;
}

/** 단일 endpoint 로 push 발송. 실패 시 DB 자동 정리. */
async function sendToEndpoint(
  row: { id: string; endpoint: string; p256dh: string; auth: string; errorCount: number },
  payload: PushPayload,
): Promise<SendResult> {
  initWebPush();

  const subscription: WebPushSubscription = {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24, // 24h
    });

    await db
      .update(pushSubscriptions)
      .set({ lastSentAt: new Date(), errorCount: 0 })
      .where(eq(pushSubscriptions.id, row.id));

    return { ok: true };
  } catch (e) {
    const statusCode =
      typeof e === "object" && e !== null && "statusCode" in e
        ? Number((e as { statusCode: unknown }).statusCode)
        : undefined;
    const message = e instanceof Error ? e.message : String(e);

    if (statusCode && PERMANENT_FAILURE_STATUS.has(statusCode)) {
      // endpoint 가 영구 무효 → 삭제
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.id, row.id));
      return { ok: false, gone: true, statusCode, message };
    }

    const nextErrorCount = row.errorCount + 1;
    if (nextErrorCount >= MAX_ERROR_COUNT) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.id, row.id));
      return { ok: false, gone: true, statusCode, message };
    }
    await db
      .update(pushSubscriptions)
      .set({ errorCount: nextErrorCount })
      .where(eq(pushSubscriptions.id, row.id));

    return { ok: false, retriable: true, statusCode, message };
  }
}

/** 동시 발송 limiter — 너무 많은 요청 동시에 보내면 PortOne·VAPID 측에서 throttle. */
const CONCURRENCY = 25;

async function sendBatch(
  rows: Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    errorCount: number;
    userId: string;
  }>,
  resolve: (row: { userId: string }) => Promise<PushPayload | null> | PushPayload | null,
): Promise<{ sent: number; gone: number; failed: number }> {
  let sent = 0;
  let gone = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async (row) => {
        const payload = await resolve(row);
        if (!payload) return null;
        return sendToEndpoint(row, payload);
      }),
    );
    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value) continue;
      if (r.value.ok) sent += 1;
      else if (r.value.gone) gone += 1;
      else failed += 1;
    }
  }
  return { sent, gone, failed };
}

/** 특정 사용자(모든 디바이스)에게 발송. */
export async function sendToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; gone: number; failed: number }> {
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return sendBatch(rows, () => payload);
}

/** 여러 사용자에게 일괄 발송 (cron 용). */
export async function sendToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; gone: number; failed: number; users: number }> {
  if (userIds.length === 0) {
    return { sent: 0, gone: 0, failed: 0, users: 0 };
  }
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));
  const result = await sendBatch(rows, () => payload);
  return { ...result, users: userIds.length };
}

/** 모든 구독자에게 발송 (cron — 매일 운세 등). */
export async function sendToAll(
  payload:
    | PushPayload
    | ((
        userId: string,
      ) => Promise<PushPayload | null> | PushPayload | null),
): Promise<{ sent: number; gone: number; failed: number; total: number }> {
  const rows = await db.select().from(pushSubscriptions);
  const resolve =
    typeof payload === "function"
      ? (row: { userId: string }) => payload(row.userId)
      : () => payload;
  const result = await sendBatch(rows, resolve);
  return { ...result, total: rows.length };
}

/** 특정 endpoint 한 개에 발송 (자기 자신 테스트용). */
export async function sendByEndpoint(
  userId: string,
  endpoint: string,
  payload: PushPayload,
): Promise<SendResult> {
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { ok: false, message: "구독을 찾을 수 없습니다." };
  }
  return sendToEndpoint(row, payload);
}
