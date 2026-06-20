"use server";

/**
 * 손금 풀이 server action.
 *
 * FormData 입력:
 *   - image: 손바닥 사진 (File, JPEG/PNG/WEBP, 1MB 미만 권장)
 *   - question: 궁금한 점 (선택, 100자 이내)
 *   - consent: 사용자 동의 (true 가 아니면 거부)
 *
 * 프라이버시:
 *   - 이미지는 FormData 로만 전달, DB·storage 안 저장.
 *   - 처리 후 base64 String 도 GC 되도록 즉시 참조 해제.
 */
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { getTranslations } from "next-intl/server";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import { readPalm } from "@/lib/palm/service";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";

/** 손금 액션 상태 — UI 가 결과 표시·에러 분기에 사용. */
export type PalmActionState =
  | { kind: "idle" }
  | { kind: "result"; interpretation: string }
  | { kind: "error"; message: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB 한도 (클라이언트 압축 후 보통 200KB 정도)

function isAllowedMediaType(
  t: string,
): t is "image/jpeg" | "image/png" | "image/webp" {
  return t === "image/jpeg" || t === "image/png" || t === "image/webp";
}

export async function analyzePalmAction(
  _prev: PalmActionState,
  formData: FormData,
): Promise<PalmActionState> {
  const tErr = await getTranslations("actionErrors");
  const consent = formData.get("consent");
  if (consent !== "true") {
    return {
      kind: "error",
      message: tErr("palmConsentRequired"),
    };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return {
      kind: "error",
      message: tErr("palmImageRequired"),
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      kind: "error",
      message: tErr("palmImageTooLarge"),
    };
  }
  if (!isAllowedMediaType(file.type)) {
    return {
      kind: "error",
      message: tErr("palmUnsupportedType"),
    };
  }

  const rawQuestion = String(formData.get("question") ?? "").trim();
  const question = rawQuestion.length > 0 ? rawQuestion.slice(0, 100) : undefined;

  const { profile } = await requireProfile();

  // 손금은 라이트+ 전용 (Vision API 비용 보호).
  const subscribed = await hasActiveSubscription(profile.userId);
  if (!subscribed) {
    return {
      kind: "error",
      message: tErr("palmPremiumOnly"),
    };
  }

  try {
    enforceAiRateLimit(profile.userId, "palm");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: tErr("rateLimitedSeconds", { n: e.retryAfterSec }),
      };
    }
    throw e;
  }

  // 일일 한도 차감 — 손금은 별도 카운터 (라이트 3회/일, 프로 5회/일).
  // 무료는 max=0 으로 무조건 한도 초과 (라이트+ 가드는 위에서 이미 통과).
  const quota = await checkAndIncrementQuota({
    userId: profile.userId,
    kind: "palm",
    max: FREE_DAILY_LIMITS.fortune,
    amount: 2,
  });
  if (!quota.ok) {
    return {
      kind: "error",
      message: tErr("palmQuotaExceeded", { n: quota.max }),
    };
  }

  // 이미지 base64 인코딩 — 메모리에만 유지, 즉시 사용 후 폐기.
  const buf = await file.arrayBuffer();
  const imageBase64 = Buffer.from(buf).toString("base64");

  try {
    const result = await readPalm({
      imageBase64,
      mediaType: file.type,
      question,
    });

    return {
      kind: "result",
      interpretation: result.interpretation,
    };
  } catch (e) {
    console.error("[analyzePalmAction]", {
      message: e instanceof Error ? e.message : String(e),
      userId: profile.userId,
    });
    return {
      kind: "error",
      message:
        e instanceof Error && e.message.includes("API")
          ? tErr("aiSlowRetry")
          : tErr("palmGenericError"),
    };
  }
}
