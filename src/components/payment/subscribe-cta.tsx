"use client";

/**
 * 구독 시작 CTA — 결제 PG 분기.
 *
 * 환경변수 NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되어 있으면 토스 버튼,
 * 아니면 기존 LS 링크로 폴백. 마이그 cutover 시 토스 키만 설정하면 자동 전환.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";
import { TossSubscribeButton } from "@/components/payment/toss-subscribe-button";

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
  const useToss = !!clientEnv.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  if (useToss) {
    return (
      <TossSubscribeButton
        plan={plan}
        userId={userId}
        email={email}
        displayName={displayName}
        label={label}
        className={variant === "secondary" ? "w-full" : "w-full"}
      />
    );
  }

  // LS 폴백 — 마이그 cutover 전 또는 토스 키 없을 때
  const href = plan === "pro" ? "/api/checkout/pro" : "/api/checkout";
  return (
    <Button asChild className="w-full" variant={variant}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
