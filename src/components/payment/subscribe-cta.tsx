"use client";

import { GooglePlaySubscribeButton } from "@/components/payment/google-play-subscribe-button";

/** Play 스토어 앱 설치 링크 — 웹에서 구독하려는 사용자를 앱으로 유도. */
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.leonardocode.carouseloflife";

interface SubscribeCtaProps {
  displayName?: string | null;
  email: string;
  label: string;
  plan: "lite" | "pro";
  returnTo?: string;
  userId: string;
  variant?: "default" | "secondary";
}

/**
 * 구독 CTA — 결제는 **안드로이드 앱(Google Play)에서만** 진행한다.
 *
 * - 앱(TWA): Google Play 결제 버튼 (data-show-in-android).
 * - 웹: 결제 수단 없음 → 앱 설치 유도 (data-hide-in-app).
 *
 * 웹 결제(PortOne)는 제거됨 — 정책상 결제는 앱 전용.
 */
export function SubscribeCta({
  label,
  plan,
  returnTo,
  variant,
}: SubscribeCtaProps) {
  return (
    <>
      {/* 앱: Google Play 결제 — 인앱에서만 노출 */}
      <div data-show-in-android className="space-y-1.5">
        <GooglePlaySubscribeButton
          plan={plan}
          label={label}
          className="w-full"
          returnTo={returnTo}
          variant={variant}
        />
        <p className="text-[12px] leading-5 text-muted-foreground">
          구독은 Google Play 결제로 안전하게 진행돼요.
        </p>
      </div>

      {/* 웹: 결제 없음 — 앱 설치 안내 */}
      <div data-hide-in-app className="space-y-2">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground transition hover:opacity-90"
        >
          앱에서 구독하기
        </a>
        <p className="text-[12px] leading-5 text-muted-foreground">
          구독·결제는 안드로이드 앱에서만 가능해요. 앱을 설치하고 로그인하면
          멤버십을 시작할 수 있어요.
        </p>
      </div>
    </>
  );
}
