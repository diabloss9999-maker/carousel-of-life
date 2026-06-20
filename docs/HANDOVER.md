# 인수인계 프롬프트 — 인생의 회전목마 (Carousel of Life)

> 이 문서를 새 AI 세션 시작 시 그대로 붙여넣어 컨텍스트 인수인계.
> 작성일: 2026-05-27, 작성자: Claude (이전 세션)

---

## 1. 프로젝트 한 줄 요약

**한국어 AI 사주·운세·점술 SaaS**. 버추얼 아이돌 그룹 "Carousel Nine"의 9명 멤버가 대화·타로·룬·사주·꽃점을 풀이하는 월 구독 서비스.

- **도메인**: https://carouseloflife.com
- **로컬 경로**: `C:\Users\User\projects\carousel-of-life`
- **GitHub**: https://github.com/diabloss9999-maker/carousel-of-life
- **호스팅**: Vercel (`carousel-of-life` 프로젝트)
- **DB**: Supabase (project URL → `.env.local` 의 `NEXT_PUBLIC_SUPABASE_URL`)
- **법인**: 레오나르도코드 (사업자 859-35-01908)
- **대표·운영자**: 최영탁 (`diabloss9999@gmail.com`)

---

## 2. 사용자(오너) 작업 스타일 — 반드시 따를 것

CLAUDE.md (프로젝트 루트 `C:\Users\User\CLAUDE.md`) 의 모든 규칙 + 추가:

### 절대 규칙
- **한국어로 소통**, 기술 용어는 영어 원문 (예: "컴포넌트", "라우트")
- **`pnpm` 만 사용** (npm·yarn 금지)
- **`any` 타입 금지** — strict TypeScript
- **`console.log` 디버깅 코드 prod 잔존 금지**
- **인라인 style 금지** — Tailwind CSS 4 만
- **코드 생략 금지** — `// ...` `// TODO 나중에` 같은 미완성 전달 금지
- **API 키·시크릿 코드 직접 기입 금지** — `.env.local` + `process.env`

### 작업 후 검증 (매번 필수)
```bash
pnpm tsc --noEmit   # 타입 에러 0
pnpm lint            # 에러 0 (warning 일부 OK)
pnpm build           # prod 빌드 통과
```

### 배포 패턴 (Vercel 자동 배포가 가끔 끊김)
```bash
git add <files>
git commit -m "type(scope): ko msg"
git push origin main
vercel deploy --prod --yes        # 수동 (자동 안 되면)
vercel alias set <deploy-url> carouseloflife.com
```

### DB 마이그레이션 패턴
- Drizzle 스키마 수정 → `supabase/migrations/NNNN_name.sql` 작성 → **코드 배포와 같은 단위로 즉시 적용** (분리 X)
- 적용 스크립트 예시: `scripts/apply-migration-0013.mts` 참조
- `DATABASE_URL` 환경변수 사용 (postgres-js)

### 검증·점검 패턴
- 코드 수정 후 **Chrome MCP** 로 prod 페이지 직접 방문해 동작 확인
- 사용자가 "직접 확인해" 라고 하면 → 페이지 로딩만 보지 말고 **실제 인터랙션** (클릭·입력·결과)까지
- 인터랙션 자동화 한계 영역 (이미지 업로드·React controlled input·실제 결제·실제 공유)은 사용자에게 직접 점검 안내

### 보안·계정·결제 — 사용자 본인이 직접
- 외부 서비스 계정 생성·로그인·결제 등은 절대 대신 수행 X
- 채팅 메시지·이메일·전화 등 사용자 명의 통신도 대신 X
- 가이드 텍스트·UI 화면만 안내, 클릭·전송은 사용자

---

## 3. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js **16.2.6** (App Router, Turbopack, **proxy.ts** — middleware 대체) |
| 언어 | TypeScript strict |
| 스타일 | Tailwind CSS **4** (Lightning CSS) |
| UI 컴포넌트 | shadcn/ui |
| DB | Supabase (Postgres 15) |
| ORM | Drizzle ORM |
| 인증 | Supabase Auth (이메일·구글) |
| AI | Anthropic Claude (Sonnet 4.6 / Haiku 4.5) |
| 결제 | PortOne V2 + NHN KCP |
| 호스팅 | Vercel |
| PWA | Service Worker (public/sw.js) + manifest |
| Android | TWA (Bubblewrap, Gradle 8.11.1) |
| 카카오 | Kakao JavaScript SDK (공유) |
| 이미지 캡처 | html-to-image |
| 패키지 매니저 | pnpm |
| 푸시 알림 | web-push (VAPID) |

---

## 4. 도메인 구조 (디렉토리 핵심)

```
src/
├── app/
│   ├── (dashboard)/        # 로그인 필수 라우트
│   │   ├── today/          # 일일 운세
│   │   ├── chat/[sessionId]/  # 캐릭터 대화
│   │   ├── saju/           # 사주 + 일진
│   │   ├── tarot/          # 타로 1장·3장·켈틱
│   │   ├── palm/           # 손금 (이미지 업로드)
│   │   ├── compatibility/  # 두 사주 궁합
│   │   ├── name-compatibility/  # 이름 궁합
│   │   ├── flower-oracle/  # 플로로랜시 (꽃점 60종)
│   │   ├── collection/     # 도감 257장 + 가챠
│   │   ├── stories/        # 9 챕터 스토리
│   │   ├── settings/       # 사용자 설정
│   │   └── chat/page.tsx   # 캐릭터 선택
│   ├── (auth)/             # /login /signup
│   ├── pricing/            # 멤버십 (PortOne 결제)
│   ├── business/           # 사업자 정보
│   ├── terms/ privacy/ refund/
│   ├── share/page.tsx      # Q&A 공유 페이지 (OG 카드)
│   └── api/                # Route Handlers
│       ├── chat/sessions/[sessionId]/messages/  # 채팅 스트림
│       ├── webhooks/portone/  # 결제 웹훅
│       ├── cron/           # 일일 푸시·이미지 정리
│       └── share/upload-image/  # Supabase Storage 업로드
├── lib/
│   ├── chat/               # 캐릭터·세션·reading-detector
│   ├── ai/                 # Anthropic SDK 래퍼 + 프롬프트
│   ├── payment/            # PortOne + KCP + billing-issue
│   ├── saju/               # 사주 계산 + 심층 분석
│   ├── tarot/ lenormand/ runes/ flower-oracle/
│   ├── collection/         # cards-data.ts (257장)
│   ├── crack/              # 균열 시스템 (9챕터 서사)
│   ├── affinity/           # 친밀도 (캐릭터별 Lv)
│   ├── systems/            # daily-seed, entity-mood 등
│   ├── auth/               # get-user, admin (마스터 식별)
│   └── constants/          # business-info.ts ⭐ SUBSCRIPTION 등
├── components/             # UI (chat-window, fortune-card, share-button 등)
├── db/schema/index.ts      # Drizzle 스키마 (chat_messages, profiles 등)
├── proxy.ts                # Next.js 16 middleware 대체 (CSRF + auth)
└── i18n/messages/{ko,en}.json

supabase/migrations/0001~0013_*.sql  # DB 마이그레이션
public/
├── flowers/01~60.png       # 꽃점 60종
├── tarot/                  # 타로 78장
├── runes/                  # 룬 24장
├── lenormand/              # 르노르망 36장
├── collection/             # 카드 뒷면들
└── icons-pwa/              # PWA 아이콘
```

---

## 5. 환경변수 (.env.local 필수 키)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgres://...   # Drizzle migration 스크립트용

ANTHROPIC_API_KEY=...

# PortOne V2
NEXT_PUBLIC_PORTONE_STORE_ID=store-d2bbcd82-d93a-4dfb-a305-fc0b23c57ceb
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-5b09f927-076c-42ad-955b-57d6f5fb2089
PORTONE_API_SECRET=...
PORTONE_WEBHOOK_SECRET=whsec_...

# KCP
KCP_SITE_CODE=IP7W1

# Optional overrides
NEXT_PUBLIC_BUSINESS_PHONE=050-6461-9495
NEXT_PUBLIC_SUPPORT_EMAIL=diabloss9999@gmail.com

# 카카오 공유
NEXT_PUBLIC_KAKAO_JS_KEY=...

# 푸시 알림 (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:diabloss9999@gmail.com

# Cron (Vercel)
CRON_SECRET=...
```

`.env.example` 항상 최신 유지.

---

## 6. 사업자 정보 (footer·약관·결제 동의서에 노출)

| 항목 | 값 |
|------|------|
| 상호 | 레오나르도코드 |
| 대표 | 최영탁 |
| 사업자등록번호 | 859-35-01908 |
| 통신판매업 신고번호 | 제 2026-서울노원-0765 호 |
| 사업장 주소 | 서울특별시 노원구 동일로213길 21, 105동 803호 (01766) |
| 영문 주소 | #803, 105-Dong, 21 Dongil-ro 213-gil, Nowon-gu, Seoul 01766, Republic of Korea |
| 전화 | **050-6461-9495** (SKT 050 안심번호, 휴대폰 010-9426-9495 착신) |
| 이메일 | diabloss9999@gmail.com |
| 호스팅 | Vercel Inc. |

→ 단일 source: `src/lib/constants/business-info.ts`

---

## 7. 결제 시스템 — PortOne + KCP

### 결제 절차
1. `/pricing` → SubscribeCta → PortOne SDK (`@portone/browser-sdk`) 결제창
2. 빌링키 발급 (KCP v2 issue-billing-key)
3. `lib/payment/portone-subscription.ts` 에서 빌링키 → 즉시 결제 → `subscriptions` 테이블 insert
4. 매월 자동 결제: `cron/charge-subscriptions/route.ts` (deterministic paymentId = `buildRecurringPaymentId(subId, periodEnd)`)
5. 웹훅: `app/api/webhooks/portone/route.ts` — `@portone/server-sdk` `Webhook.verify` (standardwebhooks/svix)

### 보안
- 모든 paymentId 는 deterministic (멱등성)
- amount mismatch 자동 감지 → cancelPayment
- `lib/payment/billing-issue.ts` — 15분 TTL 의 pending issue 추적
- KCP 사이트코드 IP7W1 (카드사 심사 완료)

### 현재 PG 심사 상태 (2026-05-27)
- ✅ KCP 카드사 심사 통과
- ⏳ **NHN KCP PG 계약 단계 진행 중** — 050 footer 적용 후 사용자가 1544-8662 에 직접 재신청 전화 예정
- ❌ KCP 일반결제 1건 반려·취소됨 (정기결제만 진행)
- ❌ 카카오페이 반려 (별도 추후)
- 🔄 KG이니시스 진행중 2건, 다날 진행중 1건 (백업 PG)

### KCP 카드사 심사 동결 영역 (약 2주 — 통과까지)
다음을 절대 변경 금지:
- `/pricing` 가격 (SUBSCRIPTION 상수)
- `/login` 로그인 절차
- footer 사업자 정보
- `/business` `/terms` `/privacy` `/refund` 페이지

---

## 8. 핵심 도메인 — 9명 멤버 (Carousel Nine)

9명의 버추얼 아이돌 멤버. `src/lib/chat/characters.ts`

| 멤버 | (내부 id) | 포지션 | 카드 특기 |
|------|-----------|--------|-----------|
| **이안** | child | 차분한 리더 | 타로·르노르망 |
| **유준** | witch | 따뜻한 보컬 | 타로·르노르망 |
| **도윤** | sage | 선명한 퍼포머 | 타로·르노르망 |
| **재하** | shaman | 조용한 프로듀서 | 사주·천기 |
| **하루** | taoist | 밝은 무드메이커 | 사주·천기 |
| **시온** | dokkaebi | 시크한 래퍼 | 사주·천기 |
| **태오** | god | 에너지 메인댄서 | 룬 |
| **이현** | hunter | 차분한 애널리스트 | 룬 |
| **하민** | runeshaman | 몽환적인 막내 | 룬 |

### 카드 점술 분배 (`reading-detector.ts`)
- **이안·유준·도윤** → 타로 1장/3장 + 르노르망 1장
- **태오·이현·하민** → 룬 1개
- **재하·하루·시온** → 카드 점술 X (사주·천기 중심)

### 정체성 룰 (매우 중요)
- 9명은 **가상 아이돌 그룹 "Carousel Nine"의 멤버이자 AI 대화 파트너**
- 신비로운 존재나 초월적 인물로 행동하지 않음
- 운세·타로·룬·사주는 앱의 기능일 뿐, 멤버의 직업·정체성이 아님
- AI·모델·프롬프트 같은 내부 구현을 먼저 꺼내지 않음

### 캐릭터 톤 (단어 사용 정책)
- **재하·하루·시온** → 사주 기반이지만 한자·전문용어는 쉬운 한국어로 풀어서
- **이안·유준·도윤** → 한자 금지, 순한글 + 따뜻한 어미
- **태오·이현·하민** → 한자 금지, 룬·신화 어휘 사용

### 카드 그리기 절차 (`reading-detector.ts`)
- 사용자가 "타로 봐줘" / "룬 봐줘" 같이 카드 요청 → **즉시** `performDraw` → AI 응답 첫 문장에 카드 이름+정/역방향 포함
- (이전엔 2턴 defer 절차였으나 사용자 혼동·휴리스틱 오탐으로 폐기)
- 응답 스트림 앞에 `CARDS:{json}\n` 라인 prepend → 클라이언트(`chat-window.tsx`)가 파싱해 카드 이미지 렌더

---

## 9. 도감 — 257장

`src/lib/collection/cards-data.ts`

| 카테고리 | 장수 |
|----------|------|
| 타로 | 78 |
| 르노르망 | 36 |
| 룬 | 24 |
| 꽃점 | **60** (기존 30 + 추가 30) |
| 십이간지 | 12 |
| 별자리 | 12 |
| 천간 | 10 |
| 캐릭터 | 9 |
| MBTI | 16 |
| **합계** | **257** |

- 가챠: 무료 1회/일, 라이트 3회/일, 프로 5회/일
- 중복 시 +3 "문답 보너스"
- 마스터 계정 (`diabloss9999@gmail.com`) — `lib/auth/admin.ts` 의 `isAdmin()` 으로 식별, 도감 페이지에서 모든 카드 자동 공개

---

## 10. 최근 작업 내역 (마지막 48시간 — 인수인계 시점 기준)

순차:
1. **PortOne PG 반려 대응** — footer 의 휴대폰만 노출 미달 → **SKT 050 안심번호 050-6461-9495** 적용
2. **`/flower-oracle` 60종 확장** — 신규 30 추가 (벚꽃·수선화·작약·목련·... 설강화), 카피 "30종 → 60종"
3. **`chat_messages.metadata` jsonb 컬럼** (마이그레이션 0013) — 카드 메타 영속화. **마이그레이션 누락이 prod chat 페이지 12시간 다운 유발** → 다음부터는 코드 배포와 동시에 적용
4. **도감 텍스트 흰색 통일** — `globals.css` 의 `body * { color: ... !important }` catchall 이 모든 텍스트 강제 검정. `data-keep-color` 속성으로 예외
5. **9인 캐릭터 정체성 강화** — `sharedRules` 에 [정체성 — 절대 흔들리지 않을 것] 블록 신설. AI/언어모델/프롬프트 등 모든 메타 단어 부정
6. **친구에게 보내기 + 친구 초대 기능 전면 제거** — ShareFortuneLink, InviteCard, RefCapture, invites/service 모두 삭제 (`profiles.invitedBy` 컬럼만 DB 보존)
7. **호격 조사 어색함 수정** — `"{name}야"` → `"{name},"` (받침 무관)
8. **타로 즉시 그리기 회귀 방지** — 2턴 defer 완전 제거, `looksLikeAlreadyDrew` 휴리스틱 폐기
9. **`/pricing` 결제 안내 강화** — 해지 방법(`설정 → 멤버십 → 구독 해지`)·환불 정책(전자상거래법 제17조)·고객 문의 명시
10. **TWA AAB 빌드 + assetlinks.json 등록** — Android Play Store 출시 준비
11. **점검 + 다운로드 폴더 정리** — `Downloads/_정리/` 안 카테고리별 분류

---

## 11. 다음 할 일 (우선순위)

### 즉시 (사용자 액션 대기)
- [ ] **사용자가 NHN KCP 신규/제휴상담 1544-8662 에 전화** → 050 적용 알리고 재심사 요청 → 1~3 영업일 통과
- [ ] PG 통과 후 첫 실제 결제 테스트 (테스트 계정 사용)

### 단기 (1주 이내)
- [ ] **Apple Developer Program 가입** ($99/년) — iOS PWA/WebView 앱 출시
- [ ] **Google Play Console 조직 계정 등록** — D-U-N-S 발급 필요 (D&B Korea, 무료 30일 또는 유료 $89 1-3일)
- [ ] 자체 회원가입·로그인 절차 end-to-end 점검 (마스터 외 신규 가입자)
- [ ] 카카오 OAuth 추가 (현재 이메일·구글만)

### 중기 (1~3개월)
- [ ] Supabase Auth 이메일 템플릿 한국어화
- [ ] 결제 환불 자동화 (현재는 admin email 통해 수동)
- [ ] 사용자 권리 (GDPR·개인정보 보호법) — 계정 삭제 시 데이터 cascade 검증

### 알려진 미점검 영역
- 손금 (이미지 업로드 + AI 풀이) — 사용자 직접 확인 필요
- 궁합 (두 사주 입력) — 사용자 직접 확인 필요
- 이름 궁합 — React controlled input 자동화 한계
- 공유 기능 (카카오톡·인스타·X) — 실제 모바일 환경에서 검증
- 모바일 viewport — Chrome window resize 만 했고 실제 모바일 UA 검증 X
- 9명 멤버 카드/룬 — 유준(타로)·하민(룬)만 실제 검증, 나머지 7명 인사만 확인
- 푸시 알림 토글·구독 취소·계정 삭제 화면 — 실제 클릭 검증 X

---

## 12. 자주 쓰는 명령

```bash
# 개발
pnpm dev                              # 로컬 dev (Turbopack)
pnpm tsc --noEmit                     # 타입 체크
pnpm lint                             # ESLint
pnpm build                            # prod 빌드

# DB 마이그레이션 실행 (service role 직접)
pnpm tsx scripts/apply-migration-NNNN.mts

# 배포 (자동 안 되면 수동)
git push origin main
vercel deploy --prod --yes
vercel alias set <new-deployment> carouseloflife.com

# Vercel 로그
vercel logs https://carouseloflife.com --since 1h

# 테스트 계정 생성
pnpm tsx scripts/create-test-account.mts
```

---

## 13. 마스터·테스트 계정

| 용도 | 이메일 | 비밀번호 |
|------|--------|----------|
| 마스터 (오너) | diabloss9999@gmail.com | (개인) |
| 카드사 심사 — 무료 | test-card-review@carouseloflife.com | `TestCard2026!` |
| 카드사 심사 — 프리미엄 | test-card-review-premium@carouseloflife.com | `TestCardPremium2026!` |

마스터 계정 권한 (`lib/auth/admin.ts`):
- 도감 모든 카드 자동 공개
- 스토리 모든 챕터 자동 해금
- 향후 운영 관련 기능 자동 부여 예정

---

## 14. 흔한 함정 / 트러블슈팅

### 🔥 prod 채팅 페이지 "잠시 별빛이 흐려졌어요" 에러
→ DB 마이그레이션 미적용. `scripts/apply-migration-NNNN.mts` 실행.

### 🔥 도감 텍스트가 검정으로 보임
→ `globals.css` 의 `body *` catchall. wrapper 에 `data-keep-color` 속성 박기.

### 🔥 Vercel 자동 배포 안 됨
→ `vercel deploy --prod --yes` + `vercel alias set` 수동.

### 🔥 PortOne 결제창 비어있음
→ KCP 사이트코드가 카드사 심사 통과했는지 확인 (IP7W1). PG 계약 단계도 통과해야 결제 가능.

### 🔥 chat 응답에 카드 이미지 없음
→ `prependCardEvent` 가 stream 앞에 `CARDS:{json}\n` 라인 prepend 하는지 확인. `chat-window.tsx` 클라이언트 파서 검증.

### 🔥 캐릭터가 "저는 AI 입니다" 답변
→ `characters.ts` sharedRules 의 [정체성] 블록 확인. lore 안의 "AI" 단어도 모두 "초월 의식" 등으로 치환됐는지.

### 🔥 030/090 등 한자식 시간 표현 한국어 변환
→ today/saju 페이지의 시간 한국어화 부분 확인.

---

## 15. 인수인계 마지막 한 마디

> 이 프로젝트는 **거의 출시 직전** 상태야. KCP PG 심사 통과 + Apple/Google 등록 만 남았어. 코드 품질은 좋고, 핵심 기능은 다 작동. UX 디테일·예외 처리·콘텐츠 보강이 남은 영역.
>
> 오너는 한국어로 빠른 피드백을 선호하고, 코드 변경 후 **prod 직접 확인** 까지 가는 걸 좋아해. Vercel 자동 배포가 자주 끊기니 항상 수동 alias 까지 확인해.
>
> 사주/운세 카테고리라 KCP 가 까다로워. PG 통과 후에도 콘텐츠 자체 (사용자 오도 가능성) 정기 점검 필요. footer·약관·환불정책은 "동결 영역" 이라 함부로 건드리지 말 것.
>
> 행운을.

---

**문서 끝.**
