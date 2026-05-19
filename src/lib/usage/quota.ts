/**
 * 일일 사용량 체크 + 카운터 증가.
 *
 * - DB 함수 `increment_usage_quota(user_id, kind, max)` 를 호출
 * - 활성 구독자는 한도 무제한
 */
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { usageQuotas } from "@/db/schema";
import { LITE_DAILY_LIMITS, PRO_DAILY_LIMITS } from "@/lib/constants";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { createClient } from "@/lib/supabase/server";

export type QuotaKind = "fortune" | "tarot" | "chat" | "palm";

export interface QuotaResult {
  ok: boolean;
  count: number;
  max: number;
  /** true 면 활성 구독자라 한도 무시. */
  unlimited: boolean;
}

/**
 * 한도 체크 + 카운터 증가를 한 번에 수행한다.
 *
 * 활성 구독자는 한도 검사 없이 카운터만 증가 (사용량 추적용).
 */
export async function checkAndIncrementQuota(opts: {
  userId: string;
  kind: QuotaKind;
  max: number;
}): Promise<QuotaResult> {
  const tier = await getSubscriptionTier(opts.userId);

  let effectiveMax: number;
  if (tier === "pro") {
    effectiveMax = PRO_DAILY_LIMITS[opts.kind];
  } else if (tier === "lite") {
    effectiveMax = LITE_DAILY_LIMITS[opts.kind];
  } else {
    effectiveMax = opts.max;
  }

  const isUnlimited = false;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("increment_usage_quota", {
    p_user_id: opts.userId,
    p_kind: opts.kind,
    p_max: effectiveMax,
  });

  if (error) {
    throw new Error(`사용량 체크 실패: ${error.message}`);
  }

  const count = typeof data === "number" ? data : null;

  if (count === null) {
    return {
      ok: false,
      count: effectiveMax,
      max: effectiveMax,
      unlimited: isUnlimited,
    };
  }

  return {
    ok: true,
    count,
    max: isUnlimited ? Infinity : effectiveMax,
    unlimited: isUnlimited,
  };
}

/**
 * 오늘의 사용량 row 조회 (없으면 0). 카운터 증가하지 않음.
 */
export async function getTodayUsage(userId: string): Promise<{
  fortuneCount: number;
  tarotCount: number;
  chatCount: number;
  palmCount: number;
}> {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const [row] = await db
    .select({
      fortuneCount: usageQuotas.fortuneCount,
      tarotCount: usageQuotas.tarotCount,
      chatCount: usageQuotas.chatCount,
      palmCount: usageQuotas.palmCount,
    })
    .from(usageQuotas)
    .where(
      and(eq(usageQuotas.userId, userId), eq(usageQuotas.usageDate, today)),
    )
    .limit(1);

  return (
    row ?? {
      fortuneCount: 0,
      tarotCount: 0,
      chatCount: 0,
      palmCount: 0,
    }
  );
}

/**
 * 서울 기준 오늘 날짜 (YYYY-MM-DD).
 */
export function getTodayInSeoul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
