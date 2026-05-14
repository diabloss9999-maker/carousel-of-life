import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor 안드로이드 설정.
 *
 * 전략: server.url 로 프로덕션 URL 을 직접 로드.
 * - Next.js 의 SSR / Server Action / API Route 를 그대로 사용 가능
 * - 별도 정적 빌드 불필요
 * - 단점: 오프라인에서 작동 안 함 (PWA 가 일부 보완)
 *
 * webDir 은 server.url 사용 시 의미가 없지만 Capacitor CLI 가 요구하므로
 * 빈 폴더(public)를 가리키게 한다.
 */
const config: CapacitorConfig = {
  appId: "com.carouseloflife.app",
  appName: "인생의 회전목마",
  webDir: "public",
  server: {
    // 커스텀 도메인 — 환경변수로 override 가능.
    url:
      process.env.CAPACITOR_SERVER_URL ??
      "https://carouseloflife.com",
    cleartext: false,
    // 외부 URL 도 in-app 으로 처리할지 여부.
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    // 내부 저장소만 사용하고 외부 저장소는 접근하지 않음.
    backgroundColor: "#0d0a14",
  },
};

export default config;
