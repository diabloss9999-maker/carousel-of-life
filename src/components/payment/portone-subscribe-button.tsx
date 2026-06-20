"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as PortOne from "@portone/browser-sdk/v2";
import { track } from "@vercel/analytics";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";

interface PortOneSubscribeButtonProps {
  billingKeyMethod?: "CARD" | "EASY_PAY";
  channelKey?: string;
  className?: string;
  displayName?: string | null;
  easyPayProvider?: "KAKAOPAY" | "NAVERPAY" | "SAMSUNGPAY";
  email: string;
  icon?: ReactNode;
  label: string;
  plan: "lite" | "pro";
  returnTo?: string;
  userId: string;
  variant?: "default" | "secondary";
}

async function fetchIssueId(plan: "lite" | "pro"): Promise<string | null> {
  try {
    const res = await fetch("/api/billing/portone/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (res.ok && json.ok && typeof json.data?.issueId === "string") {
      return json.data.issueId;
    }
  } catch {
    /* Use the generic UI error below. */
  }
  return null;
}

function userIdToCustomerId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 32);
}

function portOneFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("cancel") ||
    normalized.includes("canceled") ||
    normalized.includes("cancelled") ||
    normalized.includes("사용자가 취소")
  ) {
    return "결제가 취소됐어요. 결제창을 닫았다면 다시 결제하기를 눌러 주세요.";
  }

  if (normalized.includes("popup") || normalized.includes("blocked")) {
    return "결제창이 열리지 않았어요. 브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.";
  }

  return message;
}

export function PortOneSubscribeButton({
  billingKeyMethod = "CARD",
  channelKey: channelKeyOverride,
  className,
  displayName,
  easyPayProvider,
  email,
  icon,
  label,
  plan,
  returnTo = "/today?subscribed=1",
  userId,
  variant = "default",
}: PortOneSubscribeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const storeId = clientEnv.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey =
    channelKeyOverride ?? clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  function handleClick() {
    const paymentMethod =
      billingKeyMethod === "EASY_PAY" && easyPayProvider
        ? easyPayProvider.toLowerCase()
        : "card";

    track("subscription_click", {
      provider: "portone",
      method: paymentMethod,
      plan,
    });

    if (!storeId || !channelKey) {
      track("subscription_unavailable", {
        provider: "portone",
        method: paymentMethod,
        plan,
        reason: "missing_channel",
      });
      setNotice(null);
      setError("결제 시스템이 아직 설정되지 않았어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setError(null);
    setNotice("결제 준비 중이에요.");

    startTransition(async () => {
      const issueId = await fetchIssueId(plan);
      if (!issueId) {
        track("subscription_error", {
          provider: "portone",
          method: paymentMethod,
          plan,
          reason: "issue_prepare_failed",
        });
        setNotice(null);
        setError("결제 준비에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      const customerId = userIdToCustomerId(userId);
      const issueName =
        plan === "pro"
          ? "인생의 회전목마 프로 멤버십"
          : "인생의 회전목마 라이트 멤버십";
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://carouseloflife.com";
      const redirectUrl = `${origin}/api/billing/portone/callback?plan=${plan}&issueId=${encodeURIComponent(issueId)}&returnTo=${encodeURIComponent(returnTo)}`;

      try {
        const baseOptions = {
          storeId,
          channelKey,
          issueId,
          issueName,
          customer: {
            customerId,
            fullName: displayName ?? undefined,
            email,
          },
          redirectUrl,
        };

        setNotice("결제창에서 정보를 확인해 주세요.");
        const response =
          billingKeyMethod === "EASY_PAY" && easyPayProvider
            ? await PortOne.requestIssueBillingKey({
                ...baseOptions,
                billingKeyMethod: "EASY_PAY",
                easyPay: { easyPayProvider },
              })
            : await PortOne.requestIssueBillingKey({
                ...baseOptions,
                billingKeyMethod: "CARD",
              });

        if (response && "code" in response && response.code != null) {
          track("subscription_error", {
            provider: "portone",
            method: paymentMethod,
            plan,
            reason: String(response.code).slice(0, 80),
          });
          setNotice(null);
          setError(
            `결제 실패: ${(response as { message?: string }).message ?? "알 수 없는 오류"}`,
          );
          return;
        }

        if (response && "billingKey" in response && response.billingKey) {
          track("subscription_redirect", {
            provider: "portone",
            method: paymentMethod,
            plan,
          });
          setNotice("결제가 확인됐어요. 멤버십을 활성화하는 중이에요.");
          router.push(
            `/api/billing/portone/callback?plan=${plan}&issueId=${encodeURIComponent(issueId)}&returnTo=${encodeURIComponent(returnTo)}` as never,
          );
        }
      } catch (e) {
        track("subscription_error", {
          provider: "portone",
          method: paymentMethod,
          plan,
          reason: e instanceof Error ? e.message.slice(0, 80) : "unknown",
        });
        setNotice(null);
        setError(`결제창 호출 실패: ${portOneFriendlyError(e)}`);
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
        disabled={isPending || !storeId || !channelKey}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          icon ?? null
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
