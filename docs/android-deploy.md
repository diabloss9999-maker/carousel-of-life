# 안드로이드 앱 배포 가이드

> Play Store 등록까지의 단계별 안내. 처음 한 번만 읽으면 돼요.

## 0. 사전 준비

### 0-1. 도구 설치 (1회만)
- **Java JDK 17+** — https://adoptium.net/temurin/releases/?version=17
- **Android Studio** (최신) — https://developer.android.com/studio
  - 설치 시 "Android SDK", "Android SDK Platform-Tools", "Android Virtual Device" 모두 체크
- **환경변수 설정**:
  - `JAVA_HOME` → JDK 설치 경로 (예: `C:\Program Files\Eclipse Adoptium\jdk-17`)
  - `ANDROID_HOME` → SDK 경로 (보통 `C:\Users\User\AppData\Local\Android\Sdk`)
  - `PATH` 에 `%ANDROID_HOME%\platform-tools` 추가

### 0-2. 웹 앱 먼저 배포
이 가이드는 **Vercel 등에 웹 앱이 먼저 배포되어 있다는 전제** 입니다.
앱은 웹뷰로 그 URL 을 로드하기 때문이에요.

```bash
# 권장: Vercel
pnpm dlx vercel
```

배포 후 받은 URL (예: `https://carousel-of-life.vercel.app`) 을
`capacitor.config.ts` 의 `server.url` 에 반영하세요.

## 1. 안드로이드 프로젝트 생성 (1회만)

```bash
cd C:\Users\User\projects\carousel-of-life

# android/ 폴더 생성. capacitor.config.ts 를 읽어서 native 프로젝트를 만든다.
pnpm exec cap add android
```

`android/` 폴더가 생기고 Gradle 프로젝트가 셋업돼요.

## 2. 코드 변경 후 매번

```bash
# 웹 자산 동기화 + 네이티브 의존성 갱신
pnpm exec cap sync android
```

`server.url` 만 바뀌어도 sync 한 번 필요.

## 3. 안드로이드 스튜디오에서 열기

```bash
pnpm exec cap open android
```

처음 열면 Gradle sync 가 자동 실행 (5-10분 소요).

## 4. 디버그 빌드 — 휴대폰에서 직접 테스트

1. 안드로이드 폰을 USB 로 PC 에 연결
2. 폰의 **개발자 옵션** 에서 **USB 디버깅** 켜기
3. Android Studio 상단의 ▶ Run 버튼 (또는 `Shift+F10`)
4. 휴대폰에 앱이 자동 설치 + 실행

## 5. 출시용 AAB 빌드

Play Store 는 APK 가 아니라 **AAB (Android App Bundle)** 를 받아요.

### 5-1. Keystore 생성 (서명 키, 1회만)
```bash
keytool -genkey -v -keystore carousel-release-key.jks ^
  -keyalg RSA -keysize 2048 -validity 10000 ^
  -alias carousel-key
```

- 비밀번호와 alias 이름을 **반드시 메모** (분실 시 같은 앱으로 업데이트 불가)
- `.jks` 파일은 절대 공개 저장소에 올리지 말 것

### 5-2. 서명 설정
`android/app/build.gradle` 에 signing config 추가
(상세는 https://capacitorjs.com/docs/android/deploying-to-google-play 참조)

### 5-3. AAB 빌드
Android Studio → **Build → Generate Signed Bundle / APK** → Android App Bundle
→ keystore 선택 → release → Finish

`android/app/release/app-release.aab` 파일 생성됨.

## 6. Play Store 등록

### 6-1. Google Play Console 가입
- https://play.google.com/console
- **개발자 등록비 $25** (1회 결제, 평생)
- 신분증 인증 필요

### 6-2. 앱 만들기
1. **Create app**
2. 앱 이름: `인생의 회전목마`
3. 기본 언어: 한국어
4. 앱 / 게임: **앱**
5. 무료 / 유료: **무료** (앱 자체는 무료, 구독 결제는 LS)

### 6-3. 정책 정보 작성
- **개인정보 처리방침** URL 필수 (`/privacy` 페이지 추가 필요)
- 광고 포함 여부: **아니오**
- 데이터 안전: 개인정보 수집 항목 신고 (이메일, 생년월일 등)
- 콘텐츠 등급: 설문 답변 → 자동 등급
- 대상 사용자: **만 13세 이상**
- 뉴스 앱 여부: **아니오**

### 6-4. 스토어 등록정보
- **앱 아이콘**: 512×512 PNG
- **그래픽 이미지**: 1024×500 (Play 스토어 상단 배너)
- **스크린샷**: 폰용 최소 2장, 1080×1920 권장
- **짧은 설명** (80자): "별·사주·타로로 오늘의 운명을 읽어드리는 신비한 친구"
- **자세한 설명** (4000자): 프리미엄 구독 안내, 무료 한도, 사용법

### 6-5. 출시
1. **Internal testing** 트랙 권장 (먼저)
2. 테스터 이메일 추가 (본인 + 베타 테스터)
3. AAB 업로드 → 검토 (24-72시간) → 승인되면 다운로드 가능
4. 안정화 후 **Production** 으로 승격

## 7. 업데이트 시

웹 앱 배포 (Vercel push) 만 하면 **앱은 자동으로 반영** 됩니다.
WebView 가 server.url 을 매번 새로 로드하기 때문이에요.

**네이티브 코드** 를 바꾼 경우만 (예: 카메라 권한 추가, 푸시 셋업 등):
1. `pnpm exec cap sync android`
2. 새 AAB 빌드
3. Play Console 에 업로드

---

## 자주 만나는 문제

**"Gradle sync failed"** → JDK 버전 확인. 17+ 필요. `java -version`
**"SDK location not found"** → `ANDROID_HOME` 환경변수 설정 확인
**"WebView 가 흰 화면"** → `server.url` 이 https 인지 확인. http 면 `cleartext: true` 필요 (비권장)
**"Login 후 redirect 가 외부 브라우저로 열림"** → Capacitor `Browser` 플러그인 또는 OAuth 콜백을 in-app 처리하도록 설정
