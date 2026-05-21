"use client";

/**
 * PortOne (포트원) 정기결제 시작 버튼.
 *
 * @portone/browser-sdk/v2 의 `requestIssueBillingKey` 호출 →
 * 결제창 띄움 → 성공 시 redirectUrl 로 issueId 전달 →
 * /api/billing/portone/callback 가 빌링키 검증 + 첫 청구 처리.
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
}

function buildIssueId(userId: string): string {
  return `bill-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
}: PortOneSubscribeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const storeId = clientEnv.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  function handleClick() {
    if (!storeId || !channelKey) {
      setError("결제 시스템이 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const issueId = buildIssueId(userId);
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
        const response = await PortOne.requestIssueBillingKey({
          storeId,
          channelKey,
          billingKeyMethod: "CARD",
          issueId,
          issueName,
          customer: {
            customerId,
            fullName: displayName ?? undefined,
            email,
          },
          redirectUrl,
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
        ) : null}
        {label}
      </Button>
      {error ? (
        <p className="text-[15px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
