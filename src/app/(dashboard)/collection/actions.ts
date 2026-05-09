"use server";

/**
 * 컬렉션 가챠 Server Actions.
 *
 * 클라이언트 컴포넌트에서 호출되어 뽑기 결과를 반환한다.
 */
import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/get-user";
import { pullGacha, type GachaPullResult } from "@/lib/collection/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

/** 가챠 액션 결과 타입 — 성공 결과 또는 에러 메시지. */
export type PullGachaActionResult =
  | GachaPullResult
  | { ok: false; error: string };

/**
 * 카드 1장 가챠 뽑기.
 *
 * - 인증 + 프로필 필수
 * - 구독 상태로 일일 한도 결정
 * - 결과 후 컬렉션 페이지 캐시 무효화
 */
export async function pullGachaAction(): Promise<PullGachaActionResult> {
  try {
    const { profile } = await requireProfile();
    const subscribed = await hasActiveSubscription(profile.userId);
    const result = await pullGacha(profile.userId, subscribed);
    if (result.ok) {
      revalidatePath("/collection");
    }
    return result;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "뽑기 중 알 수 없는 오류가 발생했어.";
    return { ok: false, error: message };
  }
}
