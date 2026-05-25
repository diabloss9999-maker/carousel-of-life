"use client";

/**
 * 카카오 JavaScript SDK 로드 컴포넌트.
 *
 * 루트 레이아웃에 한 번 마운트 → 모든 페이지에서 window.Kakao 사용 가능.
 * NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 가 없으면 SDK 자체를 로드하지 않음 (트래픽 절약).
 */
import Script from "next/script";

import { clientEnv } from "@/lib/env";

// 카카오 공식 CDN — 2.7.4 버전 + SRI integrity (XSS 공급망 보호)
// hash 출처: https://developers.kakao.com/docs/latest/ko/javascript/getting-started#install
const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
const SDK_INTEGRITY =
  "sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka";

export function KakaoSdkScript() {
  if (!clientEnv.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY) return null;
  return (
    <Script
      src={SDK_URL}
      integrity={SDK_INTEGRITY}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
