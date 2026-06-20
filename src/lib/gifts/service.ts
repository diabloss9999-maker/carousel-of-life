/**
 * 선물 재화 (별조각) 서비스 — 잔액 조회 · 구매 충전 · 선물 보내기.
 *
 * 쓰기는 전부 서버에서만 수행한다 (RLS 상 클라이언트 쓰기 차단).
 * 구매 충전은 currency_logs 의 partial unique index (reason='purchase', ref_id)
 * 로 멱등성을 보장한다 — 같은 paymentId 로 두 번 충전되지 않는다.
 */
import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  characterAffinities,
  currencyLogs,
  giftLogs,
  userCurrency,
} from "@/db/schema";
import type { CharacterId } from "@/lib/chat/characters";
import {
  buildGiftThanks,
  getGift,
  getPack,
  type GiftItem,
} from "@/lib/gifts/catalog";

/** 유저의 별조각 잔액. 행이 없으면 0. */
export async function getBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ balance: userCurrency.balance })
    .from(userCurrency)
    .where(eq(userCurrency.userId, userId))
    .limit(1);
  return row?.balance ?? 0;
}

/** 잔액 upsert — delta 만큼 증감. */
async function applyBalanceDelta(userId: string, delta: number): Promise<number> {
  const [row] = await db
    .insert(userCurrency)
    .values({ userId, balance: Math.max(delta, 0) })
    .onConflictDoUpdate({
      target: userCurrency.userId,
      set: {
        balance: sql`${userCurrency.balance} + ${delta}`,
        updatedAt: new Date(),
      },
    })
    .returning({ balance: userCurrency.balance });
  return row?.balance ?? 0;
}

/**
 * 보상 지급 (출석·이벤트 등) — refId 로 중복 지급을 막는다.
 *
 * @param refId 지급 사유 식별자 (예: "streak-2026-06-12"). 같은 refId 로
 *              이미 지급됐으면 지급하지 않는다.
 * @returns 지급 후 잔액과 실제 지급 여부.
 */
export async function creditReward(
  userId: string,
  amount: number,
  refId: string,
): Promise<{ balance: number; awarded: boolean }> {
  if (amount <= 0) return { balance: await getBalance(userId), awarded: false };

  const [existing] = await db
    .select({ id: currencyLogs.id })
    .from(currencyLogs)
    .where(
      and(
        eq(currencyLogs.userId, userId),
        eq(currencyLogs.reason, "reward"),
        eq(currencyLogs.refId, refId),
      ),
    )
    .limit(1);
  if (existing) return { balance: await getBalance(userId), awarded: false };

  await db.insert(currencyLogs).values({
    userId,
    delta: amount,
    reason: "reward",
    refId,
  });
  const balance = await applyBalanceDelta(userId, amount);
  return { balance, awarded: true };
}

/**
 * 구매 충전 (멱등).
 *
 * @returns 충전 후 잔액. 이미 처리된 paymentId 면 충전 없이 현재 잔액을 반환.
 */
export async function creditPurchase(
  userId: string,
  packId: string,
  paymentId: string,
): Promise<{ balance: number; alreadyCredited: boolean }> {
  const pack = getPack(packId);
  if (!pack) throw new Error(`알 수 없는 충전 팩: ${packId}`);

  // 멱등성 — 같은 paymentId 가 이미 원장에 있으면 재충전하지 않는다.
  const inserted = await db
    .insert(currencyLogs)
    .values({
      userId,
      delta: pack.amount,
      reason: "purchase",
      refId: paymentId,
    })
    .onConflictDoNothing()
    .returning({ id: currencyLogs.id });

  if (inserted.length === 0) {
    return { balance: await getBalance(userId), alreadyCredited: true };
  }

  const balance = await applyBalanceDelta(userId, pack.amount);
  return { balance, alreadyCredited: false };
}

export interface SendGiftResult {
  ok: true;
  balance: number;
  gift: GiftItem;
  thanks: string;
  affinityPoints: number;
}

export interface SendGiftError {
  ok: false;
  code: "UNKNOWN_GIFT" | "INSUFFICIENT_BALANCE";
}

/**
 * 멤버에게 선물 보내기 — 잔액 차감 + 선물 기록 + 친밀도 가산.
 */
export async function sendGift(
  userId: string,
  characterId: CharacterId,
  giftId: string,
): Promise<SendGiftResult | SendGiftError> {
  const gift = getGift(giftId);
  if (!gift) return { ok: false, code: "UNKNOWN_GIFT" };

  // 잔액 차감 — balance >= cost 조건부 업데이트로 동시성에도 음수 방지.
  const updated = await db
    .update(userCurrency)
    .set({
      balance: sql`${userCurrency.balance} - ${gift.cost}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userCurrency.userId, userId),
        sql`${userCurrency.balance} >= ${gift.cost}`,
      ),
    )
    .returning({ balance: userCurrency.balance });

  if (updated.length === 0) {
    return { ok: false, code: "INSUFFICIENT_BALANCE" };
  }

  const [giftRow] = await db
    .insert(giftLogs)
    .values({ userId, character: characterId, giftId: gift.id, cost: gift.cost })
    .returning({ id: giftLogs.id });

  await db.insert(currencyLogs).values({
    userId,
    delta: -gift.cost,
    reason: "gift",
    refId: giftRow?.id ?? null,
  });

  // 친밀도 가산 — upsert.
  await db
    .insert(characterAffinities)
    .values({ userId, characterId, points: gift.affinityPoints })
    .onConflictDoUpdate({
      target: [characterAffinities.userId, characterAffinities.characterId],
      set: {
        points: sql`${characterAffinities.points} + ${gift.affinityPoints}`,
        updatedAt: new Date(),
      },
    });

  return {
    ok: true,
    balance: updated[0].balance,
    gift,
    thanks: buildGiftThanks(characterId, gift.name),
    affinityPoints: gift.affinityPoints,
  };
}
