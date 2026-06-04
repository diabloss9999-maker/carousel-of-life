"use client";

import { useEffect } from "react";

/**
 * 안드로이드 TWA(앱) 컨텍스트 감지 브리지.
 *
 * Bubblewrap TWA 로 앱이 실행되면 최초 진입 시 document.referrer 가
 * `android-app://com.leonardocode.carouseloflife` 로 설정된다. 이를 감지해
 * <html> 에 data-platform="android" 를 부여하고 쿠키로 영속화한다.
 *
 * 이 표식을 기준으로 globals.css 가 앱 내부에서는 결제/구독 진입점
 * (모든 /pricing 링크 + 결제 버튼)을 숨긴다.
 * → Google Play 결제 정책 준수: 앱 안에서는 외부결제 구매를 노출하지 않고,
 *   구독은 웹사이트에서만 진행한다.
 *
 * UI 를 렌더링하지 않는다(null 반환).
 */
const ANDROID_PACKAGE_REFERRER = "android-app://com.leonardocode.carouseloflife";
const PLATFORM_COOKIE = "col_platform";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** 현재 문서가 안드로이드 TWA 안에서 열렸는지 판별한다. */
function detectAndroidApp(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.platform === "android") return true;
  if (document.cookie.includes(`${PLATFORM_COOKIE}=android`)) return true;
  return document.referrer.startsWith(ANDROID_PACKAGE_REFERRER);
}

export function PlatformBridge() {
  useEffect(() => {
    if (!detectAndroidApp()) return;
    // <html data-platform="android"> — CSS 가 결제 진입점을 숨기는 기준.
    document.documentElement.dataset.platform = "android";
    // 영속화 — SPA 네비게이션 후 referrer 가 사라져도 유지된다.
    document.cookie = `${PLATFORM_COOKIE}=android; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, []);

  return null;
}
