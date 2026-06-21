"use client";

import { CreditCard } from "lucide-react";

import { GooglePlaySubscribeButton } from "@/components/payment/google-play-subscribe-button";
import { PortOneSubscribeButton } from "@/components/payment/portone-subscribe-button";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";

interface SubscribeCtaProps {
  displayName?: string | null;
  email: string;
  label: string;
  plan: "lite" | "pro";
  returnTo?: string;
  userId: string;
  variant?: "default" | "secondary";
}

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
  displayName,
  email,
  label,
  plan,
  returnTo,
  userId,
  variant,
}: SubscribeCtaProps) {
  const usePortOne =
    !!clientEnv.NEXT_PUBLIC_PORTONE_STORE_ID &&
    !!clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  const useKakao =
    usePortOne && !!clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAO;

  const googlePlayButton = (
    <div data-show-in-android className="space-y-1.5">
      <GooglePlaySubscribeButton
        plan={plan}
        label={label}
        className="w-full"
        returnTo={returnTo}
        variant={variant}
      />
      <p className="text-[12px] leading-5 text-muted-foreground">
        Play 스토어에서 설치한 Android 앱에서는 Google Play 결제로 진행돼요.
      </p>
    </div>
  );

  if (usePortOne) {
    if (useKakao) {
      return (
        <>
          {googlePlayButton}
          <div data-hide-in-app className="space-y-2">
            <p className="text-[12px] leading-5 text-muted-foreground">
              웹에서는 카드 또는 카카오페이로 결제할 수 있어요.
            </p>
            <PortOneSubscribeButton
              plan={plan}
              userId={userId}
              email={email}
              displayName={displayName}
              label={label}
              className="w-full"
              returnTo={returnTo}
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
              className="w-full border-0 bg-[#FEE500] text-black/85 hover:bg-[#FEE500]/90"
              returnTo={returnTo}
              variant="default"
              icon={<KakaoPayMark />}
            />
          </div>
        </>
      );
    }

    return (
      <>
        {googlePlayButton}
        <div data-hide-in-app className="space-y-1.5">
          <PortOneSubscribeButton
            plan={plan}
            userId={userId}
            email={email}
            displayName={displayName}
            label={label}
            className="w-full"
            returnTo={returnTo}
            variant={variant}
            icon={<CreditCard className="h-4 w-4" aria-hidden />}
          />
          <p className="text-[12px] leading-5 text-muted-foreground">
            웹에서는 카드 결제창이 열려요.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {googlePlayButton}
      <div data-hide-in-app className="space-y-1.5">
        <Button
          type="button"
          className="w-full"
          variant={variant}
          disabled
          title="결제 설정을 확인한 뒤 다시 시도해 주세요."
        >
          결제 설정 확인 필요
        </Button>
        <p className="text-[12px] leading-5 text-muted-foreground">
          지금은 웹 결제 설정을 확인 중이에요. Android 앱에서는 Google Play 결제로 진행돼요.
        </p>
      </div>
    </>
  );
}
