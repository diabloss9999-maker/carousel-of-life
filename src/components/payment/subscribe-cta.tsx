"use client";

/**
 * 구독 시작 CTA — 결제 PG 분기.
 *
 * 결제 채널 활성 우선순위:
 *   1. PortOne (KCP 카드)         — NEXT_PUBLIC_PORTONE_STORE_ID + NEXT_PUBLIC_PORTONE_CHANNEL_KEY
 *   2. PortOne (카카오페이)         — + NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAO
 *      (위 카드 채널이 활성일 때만 추가 노출)
 *   3. 모두 없으면 "곧 오픈해요" 비활성
 *
 * 카카오페이 가맹 승인 + 채널 키 등록되면 자동으로 [카드 결제] + [카카오페이로 결제]
 * 두 버튼이 노출됨. 환경변수 추가 외 코드 변경 불필요.
 */

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";
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

/** 카카오 브랜드 마크 (단순화). 노란 배경 위 검정 말풍선. */
function KakaoPayMark() {
  return (
    <svg
      width="18"
      height="16"
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M10 0C4.477 0 0 3.582 0 8c0 2.83 1.83 5.31 4.572 6.745L3.21 17.99c-.07.176.137.31.292.193l3.79-2.516c.892.16 1.83.246 2.708.246 5.523 0 10-3.582 10-8S15.523 0 10 0z"
        fill="currentColor"
      />
    </svg>
  );
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
  const useKakao =
    usePortOne && !!clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAO;

  // 1순위: PortOne — 한국 PG 통합 게이트웨이
  if (usePortOne) {
    // 카카오페이 채널이 설정되어 있으면 카드 + 카카오페이 두 옵션 노출.
    if (useKakao) {
      return (
        <div data-hide-in-app className="space-y-2">
          <PortOneSubscribeButton
            plan={plan}
            userId={userId}
            email={email}
            displayName={displayName}
            label={label}
            className="w-full"
            variant={variant}
            icon={<CreditCard className="h-4 w-4" aria-hidden />}
          />
          <PortOneSubscribeButton
            plan={plan}
            userId={userId}
            email={email}
            displayName={displayName}
            label="카카오페이로 결제하기"
            channelKey={clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAO}
            billingKeyMethod="EASY_PAY"
            easyPayProvider="KAKAOPAY"
            className="w-full bg-[#FEE500] text-black/85 hover:bg-[#FEE500]/90 border-0"
            variant="default"
            icon={<KakaoPayMark />}
          />
        </div>
      );
    }
    // 카드 채널만 활성 — 단일 버튼
    return (
      <div data-hide-in-app className="contents">
        <PortOneSubscribeButton
          plan={plan}
          userId={userId}
          email={email}
          displayName={displayName}
          label={label}
          className="w-full"
          variant={variant}
        />
      </div>
    );
  }

  // 2순위: 결제 비활성 — 사용자에게 명시적 안내
  return (
    <div data-hide-in-app className="contents">
      <Button
        type="button"
        className="w-full"
        variant={variant}
        disabled
        title="결제 시스템 오픈 준비 중입니다."
      >
        곧 오픈해요
      </Button>
    </div>
  );
}
