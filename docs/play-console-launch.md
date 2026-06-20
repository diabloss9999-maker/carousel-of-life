# Google Play Console 출시 가이드 — 인생의 회전목마

## 빌드 산출물 (이미 준비됨)
- **AAB 파일 (업로드용)**: `C:\Users\User\Downloads\총괄 디자이너\android-release\carousel-of-life-v1.0.0-playstore-signed.aab`
  - ⚠️ 패키지 ID 변경(com.leonardocode.carouseloflife)으로 **재빌드 필요** — 위 파일은 구 패키지(com.carouseloflife.app)라 무효.
- **Keystore (출시 서명키)**: `C:\Users\User\Downloads\총괄 디자이너\android-release\carousel-of-life-release.keystore`
  - 비밀번호: 같은 폴더의 `IMPORTANT-android-key-passwords.txt` 참조 (분실 금지! 암호 관리자·USB 백업)
- **SHA256**: `45:34:C4:1F:4A:F6:9F:CD:98:6C:25:C7:35:39:19:AE:05:2C:31:FB:24:B9:99:EB:C6:10:B5:78:31:2C:B3:63`
- **Package ID**: `com.leonardocode.carouseloflife`
- **Version**: 1.0.0 (versionCode 1)

---

## Step 1 — Play Console 조직(기업) 계정 가입

### 1-A. D-U-N-S 번호 먼저 발급 받기 (필수, 가장 오래 걸림)

조직 계정은 D-U-N-S 번호 **필수**. 발급은 무료지만 시간 걸림 → 가장 먼저 진행.

**한국 D&B 코리아 발급 절차** (https://www.dnbkorea.com):
1. https://support.dnb.com/?CUST=DUNS_REQUEST → "Get my D-U-N-S Number"
2. 사업장 정보 입력:
   - **법인명 (영문)**: `Leonardo Code`
   - **법인명 (국문)**: `레오나르도코드`
   - **사업자등록번호**: 859-35-01908
   - **주소 (영문)**: `#803, 105-Dong, 21 Dongil-ro 213-gil, Nowon-gu, Seoul 01766, Republic of Korea`
   - **대표자명 (영문)**: `Youngtak Choi`
   - **연락처 / 이메일**: 위 사업자 정보
3. 무료(30일 발급) 또는 유료 DUNSFile $89 (1-3 영업일)
4. **발급 완료 시 이메일로 9자리 번호 통보** → 보관

> ⚠️ Google Play 검증 시 D-U-N-S 번호로 D&B 데이터베이스 조회 → 등록한 정보(법인명·주소)와 **정확히 일치**해야 통과. 약간 다르면 거부 → 수정 후 재시도.

### 1-B. 사업자 검증 자료 준비

Play Console 이 추가로 요구할 수 있는 문서:
- **사업자등록증** 사본 (PDF 또는 이미지)
- **통신판매업신고증** 사본 (제 2026-서울노원-0765 호)
- **전자세금계산서 발급용 이메일·전화** (회사 도메인이 없으면 개인 이메일 OK)

### 1-C. Play Console 가입 (D-U-N-S 받은 후)

https://play.google.com/console → **새 개발자 계정 만들기**:

| 항목 | 값 |
|---|---|
| 계정 유형 | **조직** (개인 X) |
| 조직명 (영문) | `Leonardo Code` |
| 조직명 (한국어) | `레오나르도코드` |
| D-U-N-S 번호 | (Step 1-A 에서 받은 9자리) |
| 사업자등록번호 | 859-35-01908 |
| 통신판매업신고번호 | 제 2026-서울노원-0765 호 |
| 사업자 주소 | 서울특별시 노원구 동일로213길 21, 105동 803호 (01766) |
| 사업자 주소 (영문) | `#803, 105-Dong, 21 Dongil-ro 213-gil, Nowon-gu, Seoul 01766, Republic of Korea` |
| 연락처 이메일 | diabloss9999@gmail.com |
| 연락처 전화번호 | +82-10-9426-9495 |
| 공개 개발자 이름 | 레오나르도코드 (스토어에 노출되는 이름) |
| 웹사이트 | https://carouseloflife.com |
| 사업 유형 | **개인사업자 (Sole Proprietorship)** |

**1회 등록비**: $25 (Google Play 평생 1회).

### 1-D. 사업자 검증 (가입 후, 1-7일)

Google 이 D-U-N-S 와 사업자 정보 대조 검증.
- D&B 데이터베이스와 일치 → 자동 승인
- 불일치 시 추가 문서 요청 → 사업자등록증·통신판매업신고증 업로드
- 본인 인증 (이미 완료한 것 활용 — Google Play 인증과는 별도이긴 함)
- 평균 1-3일 소요. 길게는 7일.

검증 완료되면 앱 등록 가능.

---

## Step 2 — 새 앱 만들기

Play Console → **앱 만들기**:

| 항목 | 값 |
|---|---|
| 앱 이름 | 인생의 회전목마 |
| 기본 언어 | 한국어 (ko-KR) |
| 앱·게임 | **앱** |
| 무료·유료 | **무료** (인앱 결제 X, 외부 결제 사용) |
| 선언 | ✅ 개발자 프로그램 정책 동의 / 미국 수출 법률 동의 |

---

## Step 3 — 앱 콘텐츠 (필수 8개 모두 작성)

### 3-1. 개인정보처리방침
- URL: `https://carouseloflife.com/privacy`

### 3-2. 앱 액세스 권한
- ✅ **모든 기능을 사용하는 데 제한된 액세스가 필요함**
- 테스트 계정 제공 (Play 심사용):
  ```
  이메일: test-card-review@carouseloflife.com
  비밀번호: TestCard2026!
  ```

### 3-3. 광고
- ❌ **광고 없음**

### 3-4. 콘텐츠 등급 (설문)
- 카테고리: **유틸리티·생산성·통신·기타**
- 설문 답변:
  - 폭력적 콘텐츠: 없음
  - 성적 콘텐츠: 없음
  - 욕설/저속 언어: 없음
  - 무서운 콘텐츠: **약간 (점술·심령 테마)** — "고스트·점술·운세" 항목 있으면 체크
  - 사용자 간 상호작용: 없음 (외부 SNS 공유만)
  - 위치 정보 공유: 없음
  - 디지털 구매: **있음** (외부 결제 시스템 — 자세히는 25.3.2 안내)
- 예상 등급: **만 12세 이상** (점술 테마)

### 3-5. 대상 연령 및 어린이 정책
- 대상 연령: **만 13세 이상**
- 어린이 대상: ❌ **아니오**

### 3-6. 뉴스 앱
- ❌ **아니오**

### 3-7. COVID-19 추적 앱
- ❌ **아니오**

### 3-8. 데이터 안전 섹션
복사용 답안:

**수집·공유하는 데이터** (필수)
| 데이터 유형 | 수집? | 공유? | 필수? | 목적 |
|---|---|---|---|---|
| 이메일 주소 | ✅ | ❌ | ✅ | 계정 관리 |
| 사용자 ID | ✅ | ❌ | ✅ | 계정 관리 |
| 이름 (선택) | ✅ | ❌ | ❌ | 개인화 |
| 생년월일 | ✅ | ❌ | ✅ | 운세·사주 풀이 |
| 결제 정보 | ❌ (PG 가 직접 수집) | - | - | - |
| 위치 | ❌ | - | - | - |
| 사진/동영상 | ✅ (손금 풀이 시) | ❌ | ❌ | 손금 풀이 AI 분석 |
| 앱 사용 기록 | ✅ | ❌ | ❌ | 푸시 알림 트리거 |
| 디바이스 ID | ❌ | - | - | - |

**보안 관행** (필수)
- ✅ 전송 중 데이터 암호화 (HTTPS/TLS 1.3)
- ✅ 사용자가 데이터 삭제 요청 가능 (`/settings` 계정 삭제)
- ✅ 데이터 처리·삭제 정책: `https://carouseloflife.com/privacy`

---

## Step 4 — 스토어 등록 정보

### 4-1. 앱 세부정보
- **앱 이름**: 인생의 회전목마
- **간단한 설명** (80자): 별의 기운과 카드의 계시로 오늘의 운명을 읽어드리는 AI 운세 앱.
- **자세한 설명**: `android/store-listing.md` 참고
- **앱 카테고리**: 라이프스타일 (또는 엔터테인먼트)
- **태그**: 운세, 사주, 타로, 점술, AI

### 4-2. 그래픽 자산
- **앱 아이콘** (512×512): `public/icons-pwa/icon-512.png`
- **그래픽 이미지** (1024×500): `android/feature-graphic-1024x500.png`
- **휴대전화 스크린샷** (최소 2장, 16:9 또는 9:16)
  - 권장 6장: 홈, 오늘의 운세, 하민 타로, 도윤 사주, 캐릭터 채팅, 단톡방
  - 결제/가격 화면은 스토어 앱 내부 노출 전략과 충돌할 수 있으므로 스크린샷에 사용하지 않는다.
- **태블릿 스크린샷** (선택): 추가 권장

### 4-3. 연락처
- 이메일: diabloss9999@gmail.com
- 웹사이트: https://carouseloflife.com
- 개인정보처리방침: https://carouseloflife.com/privacy

---

## Step 5 — 외부 결제 안내 (Google Play 정책 25.3.2)

### 5-1. 결제 정책 확인
기본 전략:
- 안드로이드 앱 내부에서는 디지털 상품 구매·구독 진입점을 노출하지 않는다.
- `PlatformBridge` 가 TWA 컨텍스트를 감지해 `/pricing` 링크와 결제 버튼을 숨긴다.
- 멤버십 구독은 앱 외부 웹사이트에서만 진행한다.

검수 전 체크:
- TWA 실기기에서 `/pricing` 링크가 메뉴·잠금 UI·설정·채팅 한도 UI에 노출되지 않는지 확인
- 심사용 계정으로 무료 플로우가 막히지 않는지 확인
- Play Console 결제 관련 문항은 실제 앱 내부 노출 상태에 맞춰 답변

---

## Step 6 — 폐쇄 테스트 (필수 14일, 12명 이상 테스터)

### 6-1. 폐쇄 테스트 트랙 만들기
Play Console → **테스트** → **폐쇄 테스트** → **트랙 만들기**:
- 트랙 이름: `closed-test-launch`
- 출시 노트: "초기 출시 — 폐쇄 테스트"

### 6-2. AAB 업로드
- **App Bundle 추가** → `carousel-of-life-v1.0.0.aab` 업로드
- 첫 업로드 시 **Play App Signing** 설정 화면:
  - ✅ **Google 에 앱 서명 키 관리 위임** (Recommended)
  - upload key 의 sha256 자동 추출
  - Play 가 자체 app signing key 생성

### 6-3. 테스터 추가 (12명 이상 권장)
- 테스터 이메일 12개 이상 등록
- 본인 + 가족 + 친구로 충당 가능
- 카카오톡으로 폐쇄 테스트 링크 공유
- ⚠️ **14일 활성 사용자 12명 이상** 조건 충족 시 프로덕션 출시 가능

### 6-4. 폐쇄 테스트 출시
- 출시 → **검토 후 출시 시작** → Play 가 검토 (보통 1~3일)
- 승인되면 테스터들이 Play 스토어에서 설치 가능

---

## Step 7 — 14일 대기 + 프로덕션 출시

### 7-1. 14일 대기 (Google Play 신규 정책)
- 폐쇄 테스트 시작일로부터 **14일** 동안 테스터 12명 이상이 앱 사용
- Play Console 의 통계로 충족 여부 확인

### 7-2. 프로덕션 트랙 출시
- 14일 충족 후 **프로덕션** 트랙으로 승급
- 동일 AAB 사용 또는 새 빌드 업로드
- 출시 노트: "정식 출시 — 인생의 회전목마 1.0"
- 검토 후 1~3일 내 Play 스토어에 게시

---

## Step 8 — 출시 후 점검

- Play Console 통계로 설치/활성 사용자 모니터링
- 크래시 리포트 (Play Console → 출시 → 안정성)
- ANR (Application Not Responding) 비율 < 0.5%
- 평점·리뷰 모니터링 → 빠른 응답
- 첫 업데이트는 1~2주 후 (v1.0.1 — 폐쇄 테스트 동안 발견된 이슈 수정)

---

## 🚨 절대 분실하면 안 되는 것

1. **`android/android.keystore` 파일**
2. **Keystore 비밀번호 `Carousel2026!`** (또는 본인이 정한 값)
3. **Play App Signing 옵션 ON 으로 등록한 사실**

분실 시:
- Play App Signing ON 이면 → Google 에 업로드 키 reset 요청 가능 (며칠 걸림)
- Play App Signing OFF 이면 → 앱 영구 업데이트 불가, 새 앱 등록 필요

→ **Keystore 파일은 USB 메모리·암호 관리자(Bitwarden/1Password) 두 곳에 백업 권장**.

---

## Step 9 — 추가 빌드 (필요 시)

새 버전 빌드 시:
```powershell
cd C:\Users\User\projects\carousel-of-life\android
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:ANDROID_HOME = "C:\Users\User\AndroidSDK"
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = "Carousel2026!"
$env:BUBBLEWRAP_KEY_PASSWORD = "Carousel2026!"

# twa-manifest.json 의 appVersionName, appVersionCode 증가 후
bubblewrap update --appVersionName=1.0.1 --skipVersionUpgrade
.\gradlew bundleRelease
```

산출물: `app/build/outputs/bundle/release/app-release.aab`
