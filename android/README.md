# 인생의 회전목마 — Android TWA 출시 가이드

Trusted Web Activity (TWA) 로 Next.js 웹 앱을 Google Play 에 배포한다.

## 사전 준비

### 필요한 도구
- **Node.js 18+** (이미 있음)
- **JDK 17+** — Bubblewrap 가 빌드 시 사용. 없으면 첫 실행 시 자동 다운로드.
- **Android SDK** — Bubblewrap 가 자동 설치.
- **Bubblewrap CLI** — `pnpm dlx @bubblewrap/cli` 로 즉시 사용 가능 (별도 설치 불필요).

### 계정
- **Google Play Console 개발자 계정** — $25 일회성 가입 비용. 본인 명의 신용카드 + 신분증 검증 필요. https://play.google.com/console
- **Vercel** — 이미 배포 중 (carouseloflife.com).

---

## 1단계 — Bubblewrap 초기 빌드

프로젝트 루트에서:

```bash
# 1) Bubblewrap 초기화 (twa-manifest.json 읽어서 Android 프로젝트 생성)
cd android
pnpm dlx @bubblewrap/cli init --manifest ./twa-manifest.json

# 첫 실행 시 JDK·Android SDK 자동 설치 (수분 소요)
# 키스토어 생성 프롬프트가 뜨면:
#   - keystore 경로:  ./android.keystore
#   - alias:          android
#   - 비밀번호:        강력한 비밀번호 2개 설정 + 안전한 곳에 보관!
#     (분실 시 앱 업데이트 영원히 불가)
```

## 2단계 — assetlinks.json 에 키 지문 채우기

키스토어 생성 후 SHA-256 fingerprint 추출:

```bash
pnpm dlx @bubblewrap/cli fingerprint
# 또는:
keytool -list -v -keystore android.keystore -alias android
```

출력된 SHA-256 값을 복사한 후 `public/.well-known/assetlinks.json` 의
`REPLACE_ME_AFTER_KEYSTORE_GENERATED` 자리에 붙여넣기:

```json
"sha256_cert_fingerprints": [
  "AB:CD:EF:01:23:..."
]
```

이 변경을 Vercel 에 배포해야 Google Play 가 도메인-앱 연결을 검증할 수 있다.

## 3단계 — AAB 빌드

```bash
cd android
pnpm dlx @bubblewrap/cli build
# 결과물:
#   ./app-release-signed.aab    ← Google Play 업로드용
#   ./app-release-signed.apk    ← 로컬 테스트용 (선택)
```

## 4단계 — 로컬 테스트 (선택)

```bash
# adb 가 설치되어 있고 안드로이드 폰이 USB 디버깅 모드면:
adb install app-release-signed.apk

# 또는 폰에 APK 파일 직접 전송 후 설치
```

폰에서:
- 앱 실행 → 카루셀 스플래시 → /today 로 진입
- URL 바가 안 보이고 native 앱처럼 동작하면 ✅ (Digital Asset Links 검증 통과)
- URL 바가 보이면 ❌ → assetlinks.json 배포 안 됐거나 fingerprint 안 맞음

## 5단계 — Google Play Console 등록

1. https://play.google.com/console 가입
2. **앱 만들기** → 앱 정보 입력
   - 앱 이름: `인생의 회전목마`
   - 기본 언어: 한국어
   - 앱 유형: 앱
   - 무료/유료: 무료
3. **앱 정보 → 카테고리·태그**
   - 카테고리: 라이프스타일
   - 태그: 운세, 점성술, 사주, 타로
4. **앱 콘텐츠**
   - 개인정보처리방침 URL: `https://carouseloflife.com/privacy`
   - 광고: 광고 없음
   - 앱 액세스: 모든 기능 무료 접근 가능 (구독은 별도)
   - 콘텐츠 등급: 설문 응답 후 결정 (대체로 모든 연령가)
   - 타겟 사용자층: 18세 이상 (점성술·결제)
   - 뉴스 앱: 아님
   - COVID-19: 아님
   - 데이터 보안:
     - 수집 데이터: 이메일, 생년월일, 결제 정보, 사용자 콘텐츠(채팅, 사진=손금)
     - 손금 사진은 **즉시 폐기** (DB 저장 안 함) 명시
     - 전송 암호화: HTTPS
5. **결제 관련 안내 (앱 내 결제 없음)**
   - 안드로이드 앱은 인앱에서 유료 구독을 판매하지 않는다 (PlatformBridge 가
     앱 컨텍스트를 감지해 모든 /pricing 링크·결제 버튼을 숨김).
   - 멤버십 구독은 웹사이트(carouseloflife.com)에서만 진행 → Google Play
     인앱결제(IAP) 정책 적용 대상 외.
   - Data Safety 에서 "앱이 금융정보를 수집하지 않음"으로 신고 가능.
6. **메인 스토어 등록정보**
   - 앱 아이콘: 512×512 PNG (`/public/icons-pwa/icon-512.png`)
   - 그래픽 이미지: 1024×500 PNG (제작 필요)
   - 스크린샷: 16:9 또는 9:16, 최소 2장 (제작 필요)
   - 짧은 설명: 80자 이내
   - 자세한 설명: 4000자 이내
7. **출시 트랙**
   - **내부 테스트** → 본인 계정으로 검증 (1~2일)
   - **폐쇄 테스트** → 가족·지인 10명 (선택)
   - **프로덕션** → 전체 공개. Google 검토 7~10일.

## 6단계 — 출시 후 업데이트

웹 변경 사항은 자동 반영 (TWA 는 항상 현재 carouseloflife.com 을 로드).

앱 자체 업데이트(아이콘·이름·권한 변경 등)는:
```bash
cd android
# twa-manifest.json 의 appVersionCode 를 +1 하고
pnpm dlx @bubblewrap/cli update
pnpm dlx @bubblewrap/cli build
# 새 AAB 를 Play Console 에 업로드
```

---

## 주의사항

- **키스토어 분실 시 앱 업데이트 영원히 불가** — Google Play App Signing 활성화 권장 (Bubblewrap init 시 Y).
- **Digital Asset Links 검증 실패 시 URL 바가 표시되어 PWA처럼 안 보임** — assetlinks.json 의 fingerprint 정확히 확인.
- **카메라 권한**: TWA 는 Chrome Custom Tab 기반이라 카메라 접근은 Chrome 권한 위임. 별도 manifest 권한 선언 불필요. 손금 input[type=file capture] 정상 작동.
- **결제**: 앱 내 구매 동선이 없으므로(웹 전용 구독) Google Play 인앱결제 정책 비대상. 앱 안에서는 PlatformBridge 가 결제 진입점을 숨긴다.
