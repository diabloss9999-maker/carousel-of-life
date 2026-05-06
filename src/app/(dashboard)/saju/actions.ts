"use server";

/**
 * 사주 페이지 — 사주 캐시 강제 계산 액션.
 *
 * 프로필에 사주가 없으면 클릭 한 번으로 계산하게 한다.
 */
import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/get-user";
import { ensureSajuCalculated } from "@/lib/saju/calculate";

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
