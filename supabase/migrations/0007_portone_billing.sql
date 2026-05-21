-- =============================================================================
-- PortOne (포트원) 마이그레이션 — subscriptions 테이블에 PortOne 컬럼 추가
--
-- 기존 LS 컬럼·Toss 컬럼은 그대로 유지. 한 사용자가 여러 PG 구독 동시 보유 X
-- 라 nullable.
--
-- PortOne 은 한국 PG 통합 게이트웨이라 백엔드 PG (KG이니시스/KCP/Toss/Nice
-- 등) 를 자동 라우팅. 우리 시스템은 PortOne 의 빌링키만 저장하고 PG 가
-- 어디든 추후 변경 가능.
-- =============================================================================

-- PortOne 빌링 정보
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS portone_billing_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS portone_customer_id text,
  ADD COLUMN IF NOT EXISTS portone_channel_key text,
  ADD COLUMN IF NOT EXISTS portone_card_company text,
  ADD COLUMN IF NOT EXISTS portone_card_number_masked text;

-- 결제 이력 — 정기결제 매월 청구 결과를 기록
CREATE TABLE IF NOT EXISTS public.portone_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payment_id text NOT NULL UNIQUE,
  order_id text NOT NULL UNIQUE,
  tx_id text,
  amount integer NOT NULL,
  status text NOT NULL, -- 'PAID' | 'CANCELLED' | 'PARTIAL_CANCELLED' | 'FAILED' 등
  method text,
  pg_provider text, -- 백엔드 PG 식별 (kg_inicis, kcp, toss, nice 등)
  paid_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portone_payments_user_id_idx
  ON public.portone_payments (user_id);
CREATE INDEX IF NOT EXISTS portone_payments_subscription_id_idx
  ON public.portone_payments (subscription_id);

-- RLS — 사용자는 자기 결제 이력만 조회 가능
ALTER TABLE public.portone_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portone_payments_select_own"
  ON public.portone_payments FOR SELECT
  USING (auth.uid() = user_id);

-- service_role 만 INSERT/UPDATE — 사용자 직접 못 만듦 (서버 webhook 처리만)
-- (별도 INSERT 정책 없음 — service_role 은 RLS 우회 그대로)
