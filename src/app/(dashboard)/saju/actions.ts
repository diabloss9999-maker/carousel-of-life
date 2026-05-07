"use server";

/**
 * 사주 페이지 — 사주 캐시 + 심층 분석 액션.
 */
import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { getOrCreateDeepReading } from "@/lib/saju/deep-reading";

export interface CalculateSajuState {
  kind: "idle" | "error";
  message?: string;
}

export async function calculateSajuAction(): Promise<CalculateSajuState> {
  try {
    const { profile } = await requireProfile();
    await ensureSajuCalculated(profile);
    revalidatePath("/saju");
    return { kind: "idle" };
  } catch (e) {
    return {
      kind: "error",
      message:
        "사주를 계산하지 못했어: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }
}

export interface DeepReadingState {
  kind: "idle" | "error";
  message?: string;
  /** true 면 비구독자 — 결제 CTA 표시. */
  premiumOnly?: boolean;
}

/**
 * 사주 심층 분석 생성/조회.
 *
 * - 비구독자: premiumOnly = true 반환 (UI 가 결제 CTA 표시)
 * - 구독자: 캐시 또는 신규 생성
 */
export async function generateDeepReadingAction(): Promise<DeepReadingState> {
  const { profile } = await requireProfile();

  const subscribed = await hasActiveSubscription(profile.userId);
  if (!subscribed) {
    return {
      kind: "error",
      premiumOnly: true,
      message: "심층 분석은 프리미엄 멤버십에서 만나볼 수 있어.",
    };
  }

  const result = await getOrCreateDeepReading(profile);
  if (!result.ok) {
    return {
      kind: "error",
      message: result.message,
    };
  }

  revalidatePath("/saju");
  return { kind: "idle" };
}
