-- 0019_google_play_billing.sql
-- Google Play Billing (안드로이드 TWA 인앱결제) 지원.
-- 웹은 기존 PortOne(provider='portone'), 앱은 Google Play(provider='google_play').
-- subscriptions.provider 는 text 라 enum 변경 없이 'google_play' 값을 추가로 사용.

-- 1) subscriptions — Google Play 구독 식별 컬럼
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS google_play_purchase_token text,
  ADD COLUMN IF NOT EXISTS google_play_product_id text,
  ADD COLUMN IF NOT EXISTS google_play_base_plan_id text;

-- 동일 purchaseToken 으로 중복 구독 생성 방지
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_gp_token_uniq
  ON subscriptions (google_play_purchase_token)
  WHERE google_play_purchase_token IS NOT NULL;

-- 2) google_play_purchases — 구매/RTDN(실시간 개발자 알림) 이력 + 멱등 처리
CREATE TABLE IF NOT EXISTS google_play_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  -- Google Play 구매 토큰 (구독 갱신 시에도 동일 토큰 유지)
  purchase_token text NOT NULL,
  product_id text NOT NULL,
  -- 'SUBSCRIPTION' | 'INAPP'
  purchase_type text NOT NULL DEFAULT 'SUBSCRIPTION',
  -- Google RTDN 알림 유형 (예: SUBSCRIPTION_PURCHASED=4, RENEWED=2, CANCELED=3 ...)
  notification_type integer,
  acknowledged boolean NOT NULL DEFAULT false,
  expiry_time timestamptz,
  -- Google Developer API 응답 원본 (분쟁·디버깅 증빙)
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS google_play_purchases_user_idx
  ON google_play_purchases (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS google_play_purchases_token_uniq
  ON google_play_purchases (purchase_token);

-- 3) RLS — 본인 결제 이력만 조회 (쓰기는 service role 웹훅·검증 API 전용, RLS 우회)
ALTER TABLE google_play_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "google_play_purchases_select_own" ON google_play_purchases;
CREATE POLICY "google_play_purchases_select_own"
  ON google_play_purchases
  FOR SELECT
  USING (auth.uid() = user_id);
