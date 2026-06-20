"use client";

import { useEffect } from "react";

/**
 * 스토어 앱 컨텍스트 감지 브리지.
 *
 * Bubblewrap TWA 로 앱이 실행되면 최초 진입 시 document.referrer 가
 * `android-app://com.leonardocode.carouseloflife` 로 설정된다. 이를 감지해
 * <html> 에 data-platform="android" 를 부여하고 쿠키로 영속화한다.
 *
 * iOS 래퍼는 최초 startUrl 에 `?appPlatform=ios` 를 붙이거나 네이티브
 * WebView 에서 `col_platform=ios` 쿠키를 심는 방식으로 같은 처리를 쓴다.
 *
 * 이 표식을 기준으로 globals.css 가 앱 내부에서는 결제/구독 진입점
 * (모든 /pricing 링크 + 결제 버튼)을 숨긴다.
 * → 스토어 정책 준수: 앱 안에서는 외부결제 구매를 노출하지 않고, 구독은
 *   웹사이트에서만 진행한다. iOS 에서 유료 판매를 열려면 Apple IAP 로 전환한다.
 *
 * UI 를 렌더링하지 않는다(null 반환).
 */
const ANDROID_PACKAGE_REFERRERS = [
  "android-app://com.leonardocode.carouseloflife",
  "android-app://com.leonrdocode.caroseloflife",
] as const;
const PLATFORM_COOKIE = "col_platform";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const APP_VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

type AppPlatform = "android" | "ios";

/** 현재 문서가 스토어 앱 안에서 열렸는지 판별한다. */
function detectAppPlatform(): AppPlatform | null {
  if (typeof document === "undefined") return null;
  const current = document.documentElement.dataset.platform;
  if (current === "android" || current === "ios") return current;

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${PLATFORM_COOKIE}=(android|ios)(?:;|$)`),
  );
  if (cookieMatch?.[1] === "android" || cookieMatch?.[1] === "ios") {
    return cookieMatch[1];
  }

  const platformParam = new URLSearchParams(window.location.search).get(
    "appPlatform",
  );
  if (platformParam === "android" || platformParam === "ios") {
    return platformParam;
  }

  if (
    ANDROID_PACKAGE_REFERRERS.some((referrer) =>
      document.referrer.startsWith(referrer),
    )
  ) {
    return "android";
  }
  return null;
}

function lockAndroidZoom() {
  let viewport = document.querySelector<HTMLMetaElement>(
    'meta[name="viewport"]',
  );
  if (!viewport) {
    viewport = document.createElement("meta");
    viewport.name = "viewport";
    document.head.appendChild(viewport);
  }
  viewport.content = APP_VIEWPORT_CONTENT;

  let lastTouchEnd = 0;
  const preventMultiTouchZoom = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };
  const preventDoubleTapZoom = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  };

  document.addEventListener("touchmove", preventMultiTouchZoom, {
    passive: false,
  });
  document.addEventListener("touchend", preventDoubleTapZoom, {
    passive: false,
  });

  return () => {
    document.removeEventListener("touchmove", preventMultiTouchZoom);
    document.removeEventListener("touchend", preventDoubleTapZoom);
  };
}

export function PlatformBridge() {
  useEffect(() => {
    const platform = detectAppPlatform();
    if (!platform) return;
    // <html data-platform="android|ios"> — CSS 가 결제 진입점을 숨기는 기준.
    document.documentElement.dataset.platform = platform;
    document.body.classList.add("is-app-shell");
    // 영속화 — SPA 네비게이션 후 referrer/query 가 사라져도 유지된다.
    document.cookie = `${PLATFORM_COOKIE}=${platform}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    if (platform === "android") return lockAndroidZoom();
  }, []);

  return null;
}
