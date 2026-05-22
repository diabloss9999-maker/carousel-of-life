# 🚀 출시 체크리스트 — 인생의 회전목마

배포 당일·전후에 차례로 확인할 항목.

---

## ⏪ 출시 D-3 (3일 전)

### 🟢 코드 품질
- [ ] `pnpm tsc --noEmit` → 0 error
- [ ] `pnpm lint` → 0 error (warning 만 허용)
- [ ] `pnpm build` → 통과
- [ ] `pnpm audit --audit-level high` → high·critical 0건

### 🟢 환경변수 — Vercel Production
필수:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://carouseloflife.com`

결제 (NHN KCP / KG이니시스 / Toss 중 통과된 PG):
- [ ] `NEXT_PUBLIC_PORTONE_STORE_ID`
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
- [ ] `PORTONE_API_SECRET`
- [ ] `PORTONE_WEBHOOK_SECRET`
- [ ] `PORTONE_LITE_PRICE_KRW=4900`
- [ ] `PORTONE_PRO_PRICE_KRW=9900`
- [ ] `CRON_SECRET` (정기결제 cron 인증)

선택:
- [ ] `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` (카카오 로그인)
- [ ] `PROMO_FREE_DAY=false` (프로모션 무료 개방 꺼두기)

### 🟢 DB 마이그레이션 (Supabase)
- [ ] 0001 RLS policies
- [ ] 0002 triggers + functions
- [ ] 0003 추가 인덱스
- [ ] 0004 RLS missing tables
- [ ] 0005 Toss billing schema
- [ ] 0006 Palm quota
- [ ] 0007 PortOne billing
- [ ] 0008 invited_by

확인: `node -e "const sql=require('postgres')(process.env.DATABASE_URL,{ssl:'require'}); sql\`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename\`.then(r=>{console.log(r);return sql.end();})"`

---

## ⏪ 출시 D-1 (하루 전)

### 🟢 결제 시스템 동작 확인
- [ ] PortOne 채널 활성 (실연동 모드)
- [ ] Webhook URL 등록 (https://carouseloflife.com/api/webhooks/portone)
- [ ] 본인 카드로 라이트 4,900원 실결제 → 정상 처리
- [ ] /settings 에 "라이트 사용 중" 표시 확인
- [ ] `pnpm tsx scripts/check-toss-test.mts` (또는 portone 버전) 로 DB 행 검증
- [ ] 토스 대시보드에서 환불 → webhook 으로 status 동기화 확인

### 🟢 보안 점검
- [ ] RLS 활성 테이블 31/32 이상
- [ ] Rate limit: AI 호출 모든 라우트 적용
- [ ] Webhook HMAC: LS/Toss/PortOne 시그니처 검증 활성
- [ ] CORS / Origin: Server Actions 기본 Same-Origin 확인
- [ ] NEXT_PUBLIC_ 시크릿 누출 0건
- [ ] 계정 삭제 기능 동작 (`/api/account/delete`)

### 🟢 페이지 smoke test
미인증:
- [ ] `/` 랜딩 — 사업자 정보 푸터 표시
- [ ] `/pricing` — 결제 버튼 또는 "곧 오픈" 안내
- [ ] `/privacy`, `/terms`, `/refund`, `/business` — 모두 200
- [ ] `/login`, `/signup` — 200

인증 후:
- [ ] `/today` — 운세 카드 표시
- [ ] `/chat` — 9명 캐릭터 선택
- [ ] `/tarot` — 카드 뽑기 폼
- [ ] `/saju` — 사주 4기둥 표시
- [ ] `/compatibility` — 궁합 분석
- [ ] `/palm` — 손금 업로드 폼 (라이트+ 게이트)
- [ ] `/collection` — 도감 + 가챠 버튼
- [ ] `/personality` — MBTI 분석
- [ ] `/settings` — 멤버십·프로필·초대·계정삭제 모두 표시

### 🟢 모바일·태블릿
- [ ] 360px (작은 모바일) — 가로 스크롤 발생 안 함
- [ ] 768px (태블릿) — 레이아웃 정상
- [ ] 1280px (데스크탑) — 모든 카드 보임
- [ ] iOS Safari `100dvh` 정상 (주소창 가림 대응)
- [ ] 다크 모드 (default) 깨짐 없음

### 🟢 SEO·메타데이터
- [ ] 모든 페이지 타이틀 중복 없음
- [ ] Open Graph 이미지 (`/og-image.png`) 표시
- [ ] `sitemap.xml` 정상
- [ ] `robots.txt` 정상
- [ ] FAQ JSON-LD 활성
- [ ] canonical URL 설정

---

## ⏰ 출시 당일 (D-Day)

### 🟢 직전 확인
- [ ] 마지막 commit 푸시 + Vercel 자동 배포 완료
- [ ] Vercel Deployments → 최신 Production deployment "Ready" 상태
- [ ] 본인 폰에서 https://carouseloflife.com 실접속 → 정상 로드
- [ ] 카카오 OpenChat·SNS 에 출시 공지 (사전 알림)

### 🟢 결제 라이브 활성
- [ ] PortOne 라이브 키 6개 Vercel 적용
- [ ] Redeploy 후 `/pricing` 버튼 "구독 시작" 으로 변경 확인
- [ ] 실결제 1회 더 테스트 (본인 카드)

### 🟢 모니터링 켜기
- [ ] Vercel Analytics 켜져있는지
- [ ] Vercel Speed Insights 켜져있는지
- [ ] Vercel Cron (`/api/cron/charge-subscriptions`) 활성
- [ ] Supabase 사용량 알림 (free tier 한도 추적)
- [ ] Anthropic API 비용 알림 ($threshold)

### 🟢 사용자 입동 준비
- [ ] 베타 테스터 카톡방 출시 공지
- [ ] X/인스타 출시 공지 (해시태그·OG 이미지 포함)
- [ ] Google Play 폐쇄 테스트 → 프로덕션 신청 (조직 계정이면 생략)

---

## ⏩ 출시 D+1 ~ D+7

### 🟢 모니터링
- [ ] Vercel Logs — 5xx 에러율 < 0.1%
- [ ] Vercel Speed Insights — LCP < 2.5s · INP < 200ms
- [ ] Supabase — 활성 사용자 수, RLS 위반 로그
- [ ] Anthropic — 토큰 사용량 추세
- [ ] 결제 성공률 (`portone_payments` status='PAID' 비율)
- [ ] /api/cron/charge-subscriptions 매일 정상 실행

### 🟢 사용자 피드백
- [ ] 카톡 오픈채팅방 활동 모니터링
- [ ] /settings 의 피드백 카드로 들어온 의견 정리
- [ ] X/인스타 멘션·태그 검색
- [ ] 첫 결제 사용자에게 감사 메일 (수동)

### 🟢 데이터 분석
- [ ] 가입 전환율 (랜딩 → 가입 완료)
- [ ] 첫 운세 받기 전환율 (가입 → /today 운세 클릭)
- [ ] 라이트 구독 전환율 (총 사용자 중 결제 사용자)
- [ ] 친구 초대 클릭률 (`profiles.invited_by` 분포)

---

## 🚨 롤백 트리거

다음 중 하나 발생 시 즉시 롤백:
- 5xx 에러율 > 5%
- 결제 webhook 실패율 > 10%
- DB 마이그레이션으로 데이터 손실 의심
- Anthropic 비용 비정상적 폭증 (분당 $10 이상)

롤백 방법:
1. Vercel Dashboard → Deployments → 이전 안정 버전 → "Promote to Production"
2. DB 변경 있었으면 마이그레이션 역방향 적용 (SQL 수동 작성)
3. 사용자 공지 (카톡 오픈채팅방)

---

## 📞 비상 연락처

| 항목 | 연락처 |
|---|---|
| 대표자 | 최영탁 / 010-9426-9495 / diabloss9999@gmail.com |
| Vercel 지원 | https://vercel.com/support |
| Supabase 지원 | https://supabase.com/support |
| NHN KCP 가맹 | 1544-8660 |
| PortOne 지원 | https://portone.io 채팅 |
| Anthropic | https://support.anthropic.com |

---

## 📈 첫 30일 목표 (참고)

| 지표 | 목표 |
|---|---|
| 가입자 수 | 100명+ |
| 일일 활성 사용자 | 30명+ |
| 라이트 구독 전환 | 5% (5명+) |
| 5xx 에러율 | < 0.1% |
| 평균 LCP | < 2.5s |

---

**작성일**: 2026-05-22
**작성자**: 인생의 회전목마 개발팀
