"use client";

/**
 * 구독 시작 CTA — 결제 PG 분기.
 *
 * 우선순위:
 *   1. PortOne   (NEXT_PUBLIC_PORTONE_STORE_ID + NEXT_PUBLIC_PORTONE_CHANNEL_KEY)
 *   2. Toss      (NEXT_PUBLIC_TOSS_CLIENT_KEY)
 *   3. Lemon Squeezy (LEMONSQUEEZY_API_KEY 가 서버에 있을 때만)
 *   4. 모두 비활성화면 "결제 준비 중" 비활성 버튼
 *
 * 환경변수만 설정하면 자동 전환. 코드 변경 불필요.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";
import { TossSubscribeButton } from "@/components/payment/toss-subscribe-button";
import { PortOneSubscribeButton } from "@/components/payment/portone-subscribe-button";

interface SubscribeCtaProps {
  plan: "lite" | "pro";
  userId: string;
  email: string;
  displayName?: string | null;
  label: string;
  /** 디자인 — 라이트는 secondary, 프로는 primary. */
  variant?: "default" | "secondary";
  /** LS 결제 가능 여부 — 서버에서 환경변수 확인해 전달. */
  legacyLemonSqueezyEnabled?: boolean;
}

export function SubscribeCta({
  plan,
  userId,
  email,
  displayName,
  label,
  variant,
  legacyLemonSqueezyEnabled = false,
}: SubscribeCtaProps) {
  const usePortOne =
    !!clientEnv.NEXT_PUBLIC_PORTONE_STORE_ID &&
    !!clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  const useToss = !!clientEnv.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  // 1순위: PortOne — 한국 PG 통합 게이트웨이
  if (usePortOne) {
    return (
      <PortOneSubscribeButton
        plan={plan}
        userId={userId}
        email={email}
        displayName={displayName}
        label={label}
        className="w-full"
        variant={variant}
      />
    );
  }

  // 2순위: Toss 직접 연동
  if (useToss) {
    return (
      <TossSubscribeButton
        plan={plan}
        userId={userId}
        email={email}
        displayName={displayName}
        label={label}
        className="w-full"
      />
    );
  }

  // 3순위(폴백): LS — 서버에서 활성화된 경우에만
  if (legacyLemonSqueezyEnabled) {
    const href = plan === "pro" ? "/api/checkout/pro" : "/api/checkout";
    return (
      <Button asChild className="w-full" variant={variant}>
        <Link href={href}>{label}</Link>
      </Button>
    );
  }

  // 4순위: 모든 결제 비활성 — 사용자에게 명시적 안내
  return (
    <Button
      type="button"
      className="w-full"
      variant={variant}
      disabled
      title="결제 시스템 오픈 준비 중입니다."
    >
      곧 오픈해요
    </Button>
  );
}
