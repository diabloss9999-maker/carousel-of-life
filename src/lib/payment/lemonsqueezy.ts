/**
 * Lemon Squeezy SDK 초기화 및 공용 헬퍼.
 *
 * 모든 LS API 호출은 이 모듈을 통해서만 이루어진다.
 */
import "server-only";

import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  cancelSubscription as lsCancelSubscription,
  type Checkout,
} from "@lemonsqueezy/lemonsqueezy.js";

import { serverEnv } from "@/lib/env";

let initialized = false;

/**
 * SDK 를 1회만 초기화한다.
 *
 * @throws API 키가 없으면 예외.
 */
function ensureSetup() {
  if (initialized) return;

  const apiKey = serverEnv.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LEMONSQUEEZY_API_KEY 가 비어있어요. .env.local 을 확인해주세요.",
    );
  }

  lemonSqueezySetup({
    apiKey,
    onError: (err) => {
      console.error("[LemonSqueezy] SDK error:", err.message);
    },
  });

  initialized = true;
}

/**
 * 구독 결제 페이지(checkout) URL 을 생성한다.
 *
 * @returns Checkout URL (브라우저로 redirect 하면 됨)
 */
export async function createSubscriptionCheckout(opts: {
  userId: string;
  email: string;
  displayName?: string | null;
  redirectAfter?: string;
}): Promise<string> {
  ensureSetup();

  const storeId = serverEnv.LEMONSQUEEZY_STORE_ID;
  const variantId = serverEnv.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID;

  if (!storeId || !variantId) {
    throw new Error(
      "LEMONSQUEEZY_STORE_ID 또는 LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID 가 비어있어요.",
    );
  }

  const result = await createCheckout(storeId, variantId, {
    checkoutOptions: {
      embed: false,
      media: false,
      logo: true,
    },
    checkoutData: {
      email: opts.email,
      name: opts.displayName ?? undefined,
      // Webhook 에서 사용자 식별을 위해 custom_data 에 user_id 주입.
      custom: {
        user_id: opts.userId,
      },
    },
    productOptions: {
      redirectUrl: opts.redirectAfter,
      receiptThankYouNote: "축복받은 인연이에요. 별의 흐름을 함께 살펴봐요.",
    },
  });

  if (result.error) {
    throw new Error(`Checkout 생성 실패: ${result.error.message}`);
  }

  const checkoutUrl = (result.data?.data as Checkout["data"] | undefined)
    ?.attributes.url;
  if (!checkoutUrl) {
    throw new Error("Checkout URL 을 받지 못했어요.");
  }

  return checkoutUrl;
}

/**
 * 프로 구독 결제 페이지 URL 생성.
 *
 * LEMONSQUEEZY_PRO_VARIANT_ID 가 설정되어 있으면 그것을 사용하고,
 * 비어 있으면 fallback 으로 기존 SUBSCRIPTION_VARIANT_ID 를 사용한다.
 * custom_data 의 tier 필드로 프로 여부를 표시한다.
 */
export async function createProSubscriptionCheckout(opts: {
  userId: string;
  email: string;
  displayName?: string | null;
  redirectAfter?: string;
}): Promise<string> {
  ensureSetup();

  const storeId = serverEnv.LEMONSQUEEZY_STORE_ID;
  const proVariant = serverEnv.LEMONSQUEEZY_PRO_VARIANT_ID;
  const fallbackVariant = serverEnv.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID;
  const variantId = proVariant ?? fallbackVariant;

  if (!storeId || !variantId) {
    throw new Error(
      "LEMONSQUEEZY_STORE_ID 또는 SUBSCRIPTION_VARIANT_ID 가 비어있어요. Vercel 환경변수를 확인해주세요.",
    );
  }

  const result = await createCheckout(storeId, variantId, {
    checkoutOptions: { embed: false, media: false, logo: true },
    checkoutData: {
      email: opts.email,
      name: opts.displayName ?? undefined,
      custom: { user_id: opts.userId, tier: "pro" },
    },
    productOptions: {
      redirectUrl: opts.redirectAfter,
      receiptThankYouNote: "프로 멤버가 되셨어요. 별의 흐름을 마음껏 탐험하세요.",
    },
  });

  if (result.error) throw new Error(`Checkout 생성 실패: ${result.error.message}`);

  const checkoutUrl = (result.data?.data as Checkout["data"] | undefined)?.attributes.url;
  if (!checkoutUrl) throw new Error("Checkout URL 을 받지 못했어요.");

  return checkoutUrl;
}

/**
 * 구독 정보 조회 (LS 서버에서 최신 상태).
 */
export async function fetchSubscription(subscriptionId: string) {
  ensureSetup();
  const result = await getSubscription(subscriptionId);
  if (result.error) {
    throw new Error(`구독 조회 실패: ${result.error.message}`);
  }
  return result.data?.data;
}

/**
 * 구독 취소 (다음 결제일까지는 유지, 이후 만료).
 */
export async function cancelSubscription(subscriptionId: string) {
  ensureSetup();
  const result = await lsCancelSubscription(subscriptionId);
  if (result.error) {
    throw new Error(`구독 취소 실패: ${result.error.message}`);
  }
  return result.data?.data;
}
