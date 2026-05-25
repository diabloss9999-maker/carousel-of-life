"use client";

/**
 * 카카오 JavaScript SDK 로드 컴포넌트.
 *
 * 루트 레이아웃에 한 번 마운트 → 모든 페이지에서 window.Kakao 사용 가능.
 * NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 가 없으면 SDK 자체를 로드하지 않음 (트래픽 절약).
 */
import Script from "next/script";

import { clientEnv } from "@/lib/env";

const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

export function KakaoSdkScript() {
  if (!clientEnv.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY) return null;
  return (
    <Script
      src={SDK_URL}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
