"use client";

/**
 * 토스 정기결제 구독 버튼.
 *
 * 클릭 → 토스 위젯 호출 → 카드 인증 → /api/billing/auth/callback 으로 redirect
 *
 * 사용:
 *   <TossSubscribeButton plan="lite" userId={profile.userId} email={user.email} />
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";

interface TossSubscribeButtonProps {
  plan: "lite" | "pro";
  userId: string;
  email: string;
  displayName?: string | null;
  label?: string;
  className?: string;
}

/** customerKey 규칙 — 서버측 콜백 검증 로직과 동일하게 유지. */
function userIdToCustomerKey(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9\-_*]/g, "_").slice(0, 50);
}

export function TossSubscribeButton({
  plan,
  userId,
  email,
  displayName,
  label,
  className,
}: TossSubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    try {
      const clientKey = clientEnv.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 시스템 설정이 비어있어요. 잠시 후 다시 시도해주세요.");
      }

      const tossPayments = await loadTossPayments(clientKey);
      const customerKey = userIdToCustomerKey(userId);
      const payment = tossPayments.payment({ customerKey });

      // 토스 카드 인증 — 성공 시 successUrl 로 redirect (authKey 포함)
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/api/billing/auth/callback?plan=${plan}`,
        failUrl: `${window.location.origin}/api/billing/auth/callback`,
        customerEmail: email,
        customerName: displayName ?? undefined,
      });
    } catch (e) {
      setLoading(false);
      // 토스 SDK 가 throw 하는 경우는 거의 없음 — redirect 가 정상 흐름이라 catch 는 예외적
      const message =
        e instanceof Error
          ? e.message
          : "결제 위젯을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
      setError(message);
    }
  }

  // SDK 가 ANONYMOUS 토큰 사용 시 customerKey 가 빈 값이면 게스트 모드인데
  // 우리는 정기결제라 항상 인증 사용자만 호출 — userId 없으면 disable.
  const disabled = !userId || loading;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            결제 페이지로 이동 중...
          </>
        ) : (
          label ?? (plan === "pro" ? "프로 구독 시작" : "라이트 구독 시작")
        )}
      </Button>
      {error && <p className="text-[15px] text-destructive">{error}</p>}
    </div>
  );
}
