import "server-only";

import { createPrivateKey, sign } from "node:crypto";
import { readFile } from "node:fs/promises";

import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import { googlePlayPurchases, subscriptions } from "@/db/schema";
import {
  GOOGLE_PLAY_PRODUCTS,
  planFromGooglePlayProductId,
  type PaidPlanKey,
} from "@/lib/payment/google-play-products";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const DEFAULT_PACKAGE_NAME = "com.leonardocode.carouseloflife";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

type GooglePlaySubscriptionV2 = {
  subscriptionState?: string;
  acknowledgementState?: string;
  latestOrderId?: string;
  regionCode?: string;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    offerDetails?: {
      basePlanId?: string;
      offerId?: string;
    };
  }>;
};

export type VerifyGooglePlayPurchaseResult =
  | { ok: true; plan: PaidPlanKey }
  | { ok: false; code: string; message: string };

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function loadServiceAccount(): Promise<ServiceAccount | null> {
  const inline = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (inline) return JSON.parse(inline) as ServiceAccount;

  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath) {
    return JSON.parse(await readFile(filePath, "utf8")) as ServiceAccount;
  }

  return null;
}

async function getAccessToken(serviceAccount: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const claim = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: GOOGLE_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsignedJwt = `${header}.${claim}`;
  const key = createPrivateKey(serviceAccount.private_key);
  const signature = base64Url(sign("RSA-SHA256", Buffer.from(unsignedJwt), key));
  const assertion = `${unsignedJwt}.${signature}`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = await res.json();
  if (!res.ok || typeof json.access_token !== "string") {
    throw new Error(
      `Google OAuth token failed: ${json.error_description ?? json.error ?? res.status}`,
    );
  }
  return json.access_token as string;
}

function isGrantableState(state: string | undefined) {
  return (
    state === "SUBSCRIPTION_STATE_ACTIVE" ||
    state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
  );
}

async function fetchSubscriptionV2(opts: {
  accessToken: string;
  packageName: string;
  purchaseToken: string;
}) {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(opts.packageName)}/purchases/subscriptionsv2/tokens/` +
    encodeURIComponent(opts.purchaseToken);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${opts.accessToken}` },
  });
  const json = (await res.json()) as GooglePlaySubscriptionV2 & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(
      `Google Play purchase lookup failed: ${json.error?.message ?? res.status}`,
    );
  }
  return json;
}

async function acknowledgeSubscription(opts: {
  accessToken: string;
  packageName: string;
  productId: string;
  purchaseToken: string;
}) {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(opts.packageName)}/purchases/subscriptions/` +
    `${encodeURIComponent(opts.productId)}/tokens/` +
    `${encodeURIComponent(opts.purchaseToken)}:acknowledge`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(
      `Google Play acknowledge failed: ${json?.error?.message ?? res.status}`,
    );
  }
}

function expiryFromGoogle(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function verifyGooglePlayPurchase(opts: {
  userId: string;
  plan: PaidPlanKey;
  productId: string;
  purchaseToken: string;
}): Promise<VerifyGooglePlayPurchaseResult> {
  const expectedProduct = GOOGLE_PLAY_PRODUCTS[opts.plan].productId;
  if (opts.productId !== expectedProduct) {
    return {
      ok: false,
      code: "PRODUCT_PLAN_MISMATCH",
      message: "선택한 플랜과 Google Play 상품이 맞지 않아요.",
    };
  }

  const serviceAccount = await loadServiceAccount();
  if (!serviceAccount) {
    return {
      ok: false,
      code: "GOOGLE_PLAY_NOT_CONFIGURED",
      message:
        "Google Play 서버 검증 키가 아직 설정되지 않았어요. 배포 환경 변수를 먼저 연결해야 해요.",
    };
  }

  const packageName =
    process.env.GOOGLE_PLAY_PACKAGE_NAME ?? DEFAULT_PACKAGE_NAME;
  const accessToken = await getAccessToken(serviceAccount);
  const purchase = await fetchSubscriptionV2({
    accessToken,
    packageName,
    purchaseToken: opts.purchaseToken,
  });

  const lineItem =
    purchase.lineItems?.find((item) => item.productId === opts.productId) ??
    purchase.lineItems?.[0];
  const verifiedProductId = lineItem?.productId ?? opts.productId;
  const verifiedPlan = planFromGooglePlayProductId(verifiedProductId);
  if (!verifiedPlan || verifiedPlan !== opts.plan) {
    return {
      ok: false,
      code: "UNEXPECTED_PRODUCT",
      message: "Google Play에서 확인된 상품이 선택한 플랜과 달라요.",
    };
  }
  if (!isGrantableState(purchase.subscriptionState)) {
    return {
      ok: false,
      code: "SUBSCRIPTION_NOT_ACTIVE",
      message: "아직 활성화된 Google Play 구독으로 확인되지 않았어요.",
    };
  }

  if (purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
    await acknowledgeSubscription({
      accessToken,
      packageName,
      productId: verifiedProductId,
      purchaseToken: opts.purchaseToken,
    });
  }

  const expiryTime = expiryFromGoogle(lineItem?.expiryTime);
  const basePlanId = lineItem?.offerDetails?.basePlanId ?? null;
  const now = new Date();

  await db.transaction(async (tx) => {
    const [existingSubscription] = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.googlePlayPurchaseToken, opts.purchaseToken))
      .limit(1);

    const [subscription] = existingSubscription
      ? await tx
          .update(subscriptions)
          .set({
            userId: opts.userId,
            provider: "google_play",
            planKey: verifiedPlan,
            googlePlayProductId: verifiedProductId,
            googlePlayBasePlanId: basePlanId,
            status: "active",
            currentPeriodEndsAt: expiryTime,
            raw: purchase,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, existingSubscription.id))
          .returning({ id: subscriptions.id })
      : await tx
          .insert(subscriptions)
          .values({
            userId: opts.userId,
            provider: "google_play",
            planKey: verifiedPlan,
            googlePlayPurchaseToken: opts.purchaseToken,
            googlePlayProductId: verifiedProductId,
            googlePlayBasePlanId: basePlanId,
            status: "active",
            currentPeriodStartsAt: now,
            currentPeriodEndsAt: expiryTime,
            raw: purchase,
            updatedAt: now,
          })
          .returning({ id: subscriptions.id });

    if (!subscription) {
      throw new Error("Google Play subscription row was not saved");
    }

    await tx
      .update(subscriptions)
      .set({ status: "expired", endedAt: now, updatedAt: now })
      .where(
        and(
          eq(subscriptions.userId, opts.userId),
          ne(subscriptions.id, subscription.id),
          inArray(subscriptions.status, ["active", "on_trial"]),
        ),
      );

    await tx
      .insert(googlePlayPurchases)
      .values({
        userId: opts.userId,
        subscriptionId: subscription.id,
        purchaseToken: opts.purchaseToken,
        productId: verifiedProductId,
        purchaseType: "SUBSCRIPTION",
        acknowledged: true,
        expiryTime,
        raw: purchase,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: googlePlayPurchases.purchaseToken,
        set: {
          userId: opts.userId,
          subscriptionId: subscription.id,
          productId: verifiedProductId,
          acknowledged: true,
          expiryTime,
          raw: purchase,
          updatedAt: now,
        },
      });
  });

  return { ok: true, plan: verifiedPlan };
}
