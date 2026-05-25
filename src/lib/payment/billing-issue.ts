/**
 * 결제 발급 사전 바인딩 (pending_billing_issues).
 *
 * 흐름:
 *   1. 사용자가 결제 시작 클릭 → 서버에서 issueId 발급 + DB 등록 (15분 유효)
 *   2. 클라이언트가 PortOne SDK 로 redirectUrl 호출
 *   3. callback 진입 시 issueId 로 DB 조회 → userId 일치 검증
 *   4. 검증 OK → consumedAt 표시 + 기존 결제 흐름 진행
 *
 * 보안 효과:
 *   - callback URL 이 유출되어도 다른 사용자 카드로 내 구독 생성 불가
 *   - 만료된 issueId 재사용 차단
 *   - 한 issueId 두 번 소비 차단
 */
import "server-only";

import { randomBytes } from "crypto";
import { eq, lt } from "drizzle-orm";

import { db } from "@/db";
import { pendingBillingIssues } from "@/db/schema";

const TTL_MS = 15 * 60 * 1000; // 15분

/** 새 issueId 발급 + DB 등록. PortOne SDK 에 전달할 안전한 id. */
export async function createPendingBillingIssue(opts: {
  userId: string;
  plan: "lite" | "pro";
}): Promise<string> {
  const rand = randomBytes(8).toString("hex");
  const issueId = `bill-${opts.userId.slice(0, 8)}-${Date.now()}-${rand}`;

  await db.insert(pendingBillingIssues).values({
    issueId,
    userId: opts.userId,
    plan: opts.plan,
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  return issueId;
}

export type ConsumeResult =
  | { ok: true; plan: "lite" | "pro" }
  | { ok: false; code: "NOT_FOUND" | "EXPIRED" | "ALREADY_USED" | "USER_MISMATCH" };

/**
 * callback 진입 시 issueId 검증·소비.
 *   - row 없음 → NOT_FOUND
 *   - userId 불일치 → USER_MISMATCH
 *   - 만료 → EXPIRED
 *   - 이미 소비됨 → ALREADY_USED
 *   - 정상 → consumedAt 설정 + plan 반환
 */
export async function consumePendingBillingIssue(opts: {
  issueId: string;
  userId: string;
}): Promise<ConsumeResult> {
  const [row] = await db
    .select()
    .from(pendingBillingIssues)
    .where(eq(pendingBillingIssues.issueId, opts.issueId))
    .limit(1);

  if (!row) return { ok: false, code: "NOT_FOUND" };
  if (row.userId !== opts.userId) return { ok: false, code: "USER_MISMATCH" };
  if (row.consumedAt) return { ok: false, code: "ALREADY_USED" };
  if (row.expiresAt < new Date()) return { ok: false, code: "EXPIRED" };

  await db
    .update(pendingBillingIssues)
    .set({ consumedAt: new Date() })
    .where(eq(pendingBillingIssues.issueId, opts.issueId));

  return { ok: true, plan: row.plan as "lite" | "pro" };
}

/** 만료된 issue row 정리 (cron 또는 best-effort). */
export async function pruneExpiredIssues(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db
    .delete(pendingBillingIssues)
    .where(lt(pendingBillingIssues.expiresAt, cutoff));
}
