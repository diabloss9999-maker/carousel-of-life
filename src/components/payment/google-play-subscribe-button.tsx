"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GOOGLE_PLAY_PRODUCTS, type PaidPlanKey } from "@/lib/payment/google-play-products";

declare global {
  interface Window {
    getDigitalGoodsService?: (
      serviceProvider: string,
    ) => Promise<unknown>;
  }
}

interface GooglePlaySubscribeButtonProps {
  plan: PaidPlanKey;
  label: string;
  className?: string;
  returnTo?: string;
  variant?: "default" | "secondary";
}

type GooglePlayPaymentResponse = PaymentResponse & {
  details?: {
    purchaseToken?: string;
    purchaseId?: string;
  };
};

const GOOGLE_PLAY_BILLING_METHOD = "https://play.google.com/billing";

function googlePlayUnsupportedMessage(reason?: unknown) {
  const detail = reason instanceof Error && reason.message ? reason.message : "";
  const suffix = detail && !detail.includes("not supported") ? ` (${detail})` : "";
  return `Google Play 결제를 사용할 수 없어요. Play 스토어에서 설치한 최신 앱으로 다시 열어 주세요.${suffix}`;
}

function googlePlayFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("result_canceled") ||
    normalized.includes("abort") ||
    normalized.includes("cancel")
  ) {
    return "결제가 취소됐어요. 결제창을 닫았다면 다시 결제하기를 눌러 주세요.";
  }

  if (message.includes("not supported") || message.includes("지원")) {
    return googlePlayUnsupportedMessage(error);
  }

  return message;
}

async function verifyPurchase(opts: {
  plan: PaidPlanKey;
  productId: string;
  purchaseToken: string;
}) {
  const res = await fetch("/api/billing/google-play/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    const message =
      json?.error?.message ??
      "Google Play 구독 확인에 실패했어요. 잠시 후 다시 시도해 주세요.";
    throw new Error(message);
  }
}

export function GooglePlaySubscribeButton({
  plan,
  label,
  className,
  returnTo = "/today?subscribed=1",
  variant = "default",
}: GooglePlaySubscribeButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const product = GOOGLE_PLAY_PRODUCTS[plan];

  function handleClick() {
    setError(null);
    setNotice("Google Play 결제창을 여는 중이에요.");
    track("subscription_click", { provider: "google_play", plan });

    startTransition(async () => {
      if (
        typeof window === "undefined" ||
        typeof window.PaymentRequest === "undefined" ||
        typeof window.getDigitalGoodsService !== "function"
      ) {
        track("subscription_unavailable", {
          provider: "google_play",
          plan,
          reason: "missing_payment_request",
        });
        setNotice(null);
        setError("Google Play 구독은 Play 스토어에서 설치한 Android 앱에서만 사용할 수 있어요.");
        return;
      }

      let response: GooglePlayPaymentResponse | null = null;
      try {
        await window.getDigitalGoodsService(GOOGLE_PLAY_BILLING_METHOD);

        const payment = new PaymentRequest(
          [
            {
              supportedMethods: GOOGLE_PLAY_BILLING_METHOD,
              data: {
                sku: product.productId,
              },
            },
          ],
          {
            total: {
              label: product.label,
              amount: { currency: "KRW", value: "0" },
            },
          },
        );

        const canMakePayment = await payment.canMakePayment().catch(() => false);
        if (!canMakePayment) {
          track("subscription_unavailable", {
            provider: "google_play",
            plan,
            reason: "cannot_make_payment",
          });
          throw new Error(googlePlayUnsupportedMessage());
        }

        setNotice("결제창에서 구독을 완료해 주세요.");
        response = (await payment.show()) as GooglePlayPaymentResponse;
        const purchaseToken =
          response.details?.purchaseToken ?? response.details?.purchaseId;
        if (!purchaseToken) {
          throw new Error("Google Play 구매 토큰을 받지 못했어요.");
        }

        setNotice("구독 정보를 확인하고 있어요.");
        await verifyPurchase({
          plan,
          productId: product.productId,
          purchaseToken,
        });
        await response.complete("success");
        track("subscription_success", { provider: "google_play", plan });
        setNotice("구독이 완료됐어요. 잠시 후 화면을 새로고침합니다.");
        router.push(returnTo as Route);
        router.refresh();
      } catch (e) {
        await response?.complete("fail").catch(() => undefined);
        const message = e instanceof Error ? e.message : String(e);
        track("subscription_error", {
          provider: "google_play",
          plan,
          reason: message.slice(0, 80),
        });
        setNotice(null);
        setError(googlePlayFriendlyError(e));
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={className}
        variant={variant}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Smartphone className="h-4 w-4" aria-hidden />
        )}
        {label}
      </Button>
      {notice && !error ? (
        <p className="text-[13px] leading-5 text-muted-foreground">{notice}</p>
      ) : null}
      {error ? <p className="text-[13px] leading-5 text-destructive">{error}</p> : null}
    </div>
  );
}

