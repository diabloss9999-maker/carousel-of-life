# App Store / Google Play 출시 계획 — 인생의 회전목마

## 결론

`carouseloflife.com` 은 이미 PWA/TWA 구조와 Android 빌드 자료가 있으므로 Google Play 출시는 가장 빠른 경로다.
Apple App Store 는 iOS 네이티브 래퍼 또는 Capacitor 앱이 추가로 필요하며, 구독 결제 정책 때문에 출시 전략을 먼저 고정해야 한다.

## 스토어 결제 전략

현재 서비스는 웹에서 PortOne/NHN KCP 로 라이트·프로 멤버십과 재화 충전을 판매한다.
스토어 앱 안에서는 외부 결제 링크와 결제 버튼을 노출하지 않는 방향을 기본 전략으로 둔다.

- Android TWA: `PlatformBridge` 가 TWA 진입을 감지해 `/pricing` 링크와 `data-hide-in-app` 결제 UI 를 숨긴다.
- iOS 래퍼: 최초 URL 을 `/today?appPlatform=ios` 로 열면 같은 쿠키(`col_platform=ios`)가 저장되고 결제 UI 가 숨겨진다.
- iOS 앱 안에서 멤버십을 직접 판매하려면 Apple In-App Purchase 구현으로 별도 전환한다.

## Google Play 경로

현재 준비된 항목:

- 패키지 ID: `com.leonardocode.carouseloflife`
- Android TWA 프로젝트: `android/`
- Digital Asset Links: `public/.well-known/assetlinks.json`
- 스토어 설명 초안: `android/store-listing.md`
- 기능 그래픽: `android/feature-graphic-1024x500.png`
- 아이콘: `public/icons-pwa/icon-512.png`, `android/store_icon.png`
- AAB 산출물: `android/app/build/outputs/bundle/release/app-release.aab`

출시 전 확인:

- Play Console 개발자 계정 검증 완료
- 테스트 계정 준비
- 휴대폰 스크린샷을 최신 UI 기준 4~8장으로 재촬영
- 앱 내부에서 `/pricing` 진입점이 TWA 환경에서 숨겨지는지 실기기 테스트
- 앱 콘텐츠, 데이터 보안, 개인정보처리방침, 계정 삭제 경로 입력
- 신규 개인/조직 계정이면 Play Console 폐쇄 테스트 요구 조건 확인

## Apple App Store 경로

필요한 항목:

- Apple Developer Program 계정
- App Store Connect 앱 레코드
- Bundle ID 예시: `com.leonardocode.carouseloflife`
- iOS 래퍼 프로젝트: Capacitor 권장
- 앱 아이콘, 6.7형/6.5형/5.5형 등 iPhone 스크린샷
- 개인정보 처리방침 URL: `https://carouseloflife.com/privacy`
- 지원 URL: `https://carouseloflife.com`
- 심사용 계정
- 앱 개인정보 라벨 작성

권장 iOS 1차 출시 전략:

1. 앱 안에서는 결제·구독 구매를 노출하지 않는 소비/체험형 앱으로 제출한다.
2. 기존 웹 구독자는 로그인 후 보유 권한을 사용할 수 있게 한다.
3. 심사 메모에 “앱 내에서는 외부 디지털 상품 구매를 제공하지 않는다”는 점을 명시한다.
4. iOS 앱 안에서 신규 구독 판매를 열고 싶으면 Apple IAP 를 별도 구현한 v1.1 로 준비한다.

## iOS 래퍼 구현 초안

Capacitor 를 추가할 경우:

```powershell
pnpm add @capacitor/core @capacitor/ios
pnpm add -D @capacitor/cli
pnpm cap init "인생의 회전목마" "com.leonardocode.carouseloflife"
```

`capacitor.config.ts` 방향:

```ts
const config = {
  appId: "com.leonardocode.carouseloflife",
  appName: "인생의 회전목마",
  webDir: "out",
  server: {
    url: "https://carouseloflife.com/today?appPlatform=ios",
    cleartext: false,
  },
};
```

주의: iOS 빌드, 서명, 업로드는 macOS/Xcode 또는 클라우드 빌드 환경이 필요하다. Windows 단독으로는 App Store 업로드까지 완료할 수 없다.

## 스토어 설명 톤

전문 점술 서비스가 아니라 버추얼 아이돌 팬서비스와 엔터테인먼트 중심으로 설명한다.

- “하민이 취미로 타로를 봐주는 팬서비스”
- “도윤이 사주를 참고 노트처럼 풀어주는 팬서비스”
- “결정·의료·법률·금융 판단을 대신하지 않는 엔터테인먼트 콘텐츠”

## 다음 작업 순서

1. Android AAB 최신 빌드 검증
2. Android 최신 스크린샷 6장 재촬영
3. Play Console 입력 자료 최종 정리
4. iOS 래퍼 프로젝트 생성 여부 결정
5. Apple 결제 전략 결정: 소비 전용 v1.0 또는 Apple IAP 포함 v1.0
