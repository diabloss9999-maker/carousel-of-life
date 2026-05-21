"use client";

/**
 * 구독 시작 CTA — 결제 PG 분기.
 *
 * 우선순위:
 *   1. PortOne   (NEXT_PUBLIC_PORTONE_STORE_ID + NEXT_PUBLIC_PORTONE_CHANNEL_KEY)
 *   2. Toss      (NEXT_PUBLIC_TOSS_CLIENT_KEY)
 *   3. Lemon Squeezy (기본 폴백)
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
}

export function SubscribeCta({
  plan,
  userId,
  email,
  displayName,
  label,
  variant,
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

  // 3순위(폴백): LS — 마이그 cutover 전 또는 한국 PG 키 없을 때
  const href = plan === "pro" ? "/api/checkout/pro" : "/api/checkout";
  return (
    <Button asChild className="w-full" variant={variant}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
