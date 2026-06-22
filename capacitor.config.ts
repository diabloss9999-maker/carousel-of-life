import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS(App Store)용 Capacitor 설정.
 *
 * 이 앱은 SSR(Next.js 서버 컴포넌트·API·Auth) 기반이라 정적 export 가 불가능하다.
 * 따라서 안드로이드 TWA 와 동일하게, 네이티브 WebView 가 라이브 사이트를 로드한다
 * (server.url). 빌드·서명·제출은 Mac + Xcode 에서 수행한다.
 *
 * ⚠️ Apple 가이드라인 4.2: "웹사이트를 그대로 감싼 앱"은 리젝되기 쉽다.
 *    푸시 알림(APNs)·StoreKit 인앱결제 등 네이티브 기능을 반드시 함께 붙일 것.
 */
const config: CapacitorConfig = {
  appId: "com.leonardocode.carouseloflife",
  appName: "인생의 회전목마",
  // server.url 모드라 실제로는 원격 사이트를 로드. webDir 는 오프라인 폴백/필수 필드용.
  webDir: "public",
  server: {
    url: "https://carouseloflife.com",
    cleartext: false,
  },
  backgroundColor: "#161019",
  ios: {
    contentInset: "always",
    backgroundColor: "#161019",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#161019",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
