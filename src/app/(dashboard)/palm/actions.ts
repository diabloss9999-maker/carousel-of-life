"use server";

/**
 * 손금 풀이 server action.
 *
 * FormData 입력:
 *   - image: 손바닥 사진 (File, JPEG/PNG/WEBP, 1MB 미만 권장)
 *   - characterId: 풀이해줄 캐릭터 (witch | sage | child)
 *   - question: 궁금한 점 (선택, 100자 이내)
 *   - consent: 사용자 동의 (true 가 아니면 거부)
 *
 * 프라이버시:
 *   - 이미지는 FormData 로만 전달, DB·storage 안 저장.
 *   - 처리 후 base64 String 도 GC 되도록 즉시 참조 해제.
 */
import { requireProfile } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import {
  enforceAiRateLimit,
  RateLimitedError,
} from "@/lib/rate-limit/in-memory";
import {
  readPalm,
  PALM_ENABLED_CHARACTERS,
} from "@/lib/palm/service";
import type { CharacterId } from "@/lib/chat/characters";
import { checkAndIncrementQuota } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";

/** 손금 액션 상태 — UI 가 결과 표시·에러 분기에 사용. */
export type PalmActionState =
  | { kind: "idle" }
  | { kind: "result"; interpretation: string; characterId: CharacterId }
  | { kind: "error"; message: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB 한도 (클라이언트 압축 후 보통 200KB 정도)

function isAllowedCharacter(id: string): id is CharacterId {
  return PALM_ENABLED_CHARACTERS.includes(id as CharacterId);
}

function isAllowedMediaType(
  t: string,
): t is "image/jpeg" | "image/png" | "image/webp" {
  return t === "image/jpeg" || t === "image/png" || t === "image/webp";
}

export async function analyzePalmAction(
  _prev: PalmActionState,
  formData: FormData,
): Promise<PalmActionState> {
  const consent = formData.get("consent");
  if (consent !== "true") {
    return {
      kind: "error",
      message: "사진 처리 동의가 필요해요.",
    };
  }

  const rawChar = String(formData.get("characterId") ?? "");
  if (!isAllowedCharacter(rawChar)) {
    return {
      kind: "error",
      message: "손금 풀이는 이세계 캐릭터(루나·카엘·라엘) 만 가능해요.",
    };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return {
      kind: "error",
      message: "손바닥 사진을 첨부해줘.",
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      kind: "error",
      message: "사진 용량이 너무 커. 5MB 이내로 부탁해.",
    };
  }
  if (!isAllowedMediaType(file.type)) {
    return {
      kind: "error",
      message: "JPEG/PNG/WEBP 만 지원해.",
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
      message: "손금 풀이는 라이트 구독자 전용이에요. 구독 후 이용해주세요.",
    };
  }

  try {
    enforceAiRateLimit(profile.userId, "palm");
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return {
        kind: "error",
        message: `너무 빠르게 호출하고 있어. ${e.retryAfterSec}초 뒤에 다시 시도해줘.`,
      };
    }
    throw e;
  }

  // 일일 한도 차감 — 손금은 운세 카운터(fortune) 와 같이 묶어 관리.
  // LITE+ 전용이므로 실제 max 는 LITE/PRO 한도가 자동 적용됨.
  const quota = await checkAndIncrementQuota({
    userId: profile.userId,
    kind: "fortune",
    max: FREE_DAILY_LIMITS.fortune,
  });
  if (!quota.ok) {
    return {
      kind: "error",
      message: `오늘의 운세 한도(${quota.max}회)를 모두 사용했어. 내일 다시 만나.`,
    };
  }

  // 이미지 base64 인코딩 — 메모리에만 유지, 즉시 사용 후 폐기.
  const buf = await file.arrayBuffer();
  const imageBase64 = Buffer.from(buf).toString("base64");

  try {
    const result = await readPalm({
      imageBase64,
      mediaType: file.type,
      characterId: rawChar,
      question,
    });

    return {
      kind: "result",
      interpretation: result.interpretation,
      characterId: result.characterId,
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
          ? "AI 응답이 늦어. 잠시 후 다시 시도해줘."
          : "손금 풀이에 실패했어. 사진을 다시 찍어 보내볼래?",
    };
  }
}
