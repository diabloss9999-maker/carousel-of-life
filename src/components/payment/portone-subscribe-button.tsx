"use client";

/**
 * PortOne (포트원) 정기결제 시작 버튼.
 *
 * @portone/browser-sdk/v2 의 `requestIssueBillingKey` 호출 →
 * 결제창 띄움 → 성공 시 redirectUrl 로 issueId 전달 →
 * /api/billing/portone/callback 가 빌링키 검증 + 첫 청구 처리.
 *
 * 다중 결제수단 지원:
 *   - 기본: NEXT_PUBLIC_PORTONE_CHANNEL_KEY (KCP 카드)
 *   - channelKey prop 으로 override 가능 (카카오페이 등 다른 PG 채널)
 *   - billingKeyMethod / easyPayProvider 로 결제 방식 분기
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as PortOne from "@portone/browser-sdk/v2";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";
import { Loader2 } from "lucide-react";

interface PortOneSubscribeButtonProps {
  plan: "lite" | "pro";
  userId: string;
  email: string;
  displayName?: string | null;
  label: string;
  className?: string;
  variant?: "default" | "secondary";
  /**
   * 특정 채널 키 명시. 비어있으면 NEXT_PUBLIC_PORTONE_CHANNEL_KEY (KCP 카드).
   * 카카오페이/네이버페이 등 별도 채널 호출 시 해당 채널 키 전달.
   */
  channelKey?: string;
  /**
   * 결제 방식. 기본 "CARD" (KCP 카드 채널용).
   * 카카오페이/네이버페이는 "EASY_PAY" + easyPayProvider 지정.
   */
  billingKeyMethod?: "CARD" | "EASY_PAY";
  /**
   * 간편결제 제공자. billingKeyMethod="EASY_PAY" 일 때만 의미 있음.
   */
  easyPayProvider?: "KAKAOPAY" | "NAVERPAY" | "SAMSUNGPAY";
  /** 버튼 좌측에 표시할 아이콘 (선택). */
  icon?: React.ReactNode;
}

/**
 * 서버에서 issueId 발급받기 — pending_billing_issues 에 사전 등록되어 있어
 * callback 진입 시 userId 검증이 가능해진다.
 */
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
    /* fall through */
  }
  return null;
}

function userIdToCustomerId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 32);
}

export function PortOneSubscribeButton({
  plan,
  userId,
  email,
  displayName,
  label,
  className,
  variant = "default",
  channelKey: channelKeyOverride,
  billingKeyMethod = "CARD",
  easyPayProvider,
  icon,
}: PortOneSubscribeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const storeId = clientEnv.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey =
    channelKeyOverride ?? clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  function handleClick() {
    if (!storeId || !channelKey) {
      setError("결제 시스템이 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setError(null);

    startTransition(async () => {
      // 서버에서 issueId 발급 — pending_billing_issues 에 사전 바인딩
      const issueId = await fetchIssueId(plan);
      if (!issueId) {
        setError("결제 준비에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const customerId = userIdToCustomerId(userId);
      const issueName =
        plan === "pro"
          ? "인생의 회전목마 — 프로 멤버십 빌링키"
          : "인생의 회전목마 — 라이트 멤버십 빌링키";
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://carouseloflife.com";
      const redirectUrl = `${origin}/api/billing/portone/callback?plan=${plan}&issueId=${encodeURIComponent(issueId)}`;

      try {
        // 카드(KCP)와 간편결제(카카오페이 등)는 호출 옵션이 달라 분기.
        // PortOne SDK 타입 안정성 위해 각각 별도 호출.
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

        // SDK 가 redirect 모드면 response 가 undefined (페이지가 redirectUrl 로 이동).
        // popup/iframe 모드면 response.billingKey 가 직접 반환됨.
        if (response && "code" in response && response.code != null) {
          // 에러 응답
          setError(
            `결제 실패: ${(response as { message?: string }).message ?? "알 수 없는 오류"}`,
          );
          return;
        }

        if (response && "billingKey" in response && response.billingKey) {
          // popup/iframe 모드 — 직접 callback 호출
          router.push(
            `/api/billing/portone/callback?plan=${plan}&issueId=${encodeURIComponent(issueId)}` as never,
          );
        }
        // redirect 모드면 자동으로 redirectUrl 로 이동 — 추가 처리 불필요
      } catch (e) {
        setError(
          `결제창 호출 실패: ${e instanceof Error ? e.message : String(e)}`,
        );
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
      {error ? (
        <p className="text-[15px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
