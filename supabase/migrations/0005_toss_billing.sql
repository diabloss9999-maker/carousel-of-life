-- =============================================================================
-- TossPayments 마이그레이션 — subscriptions 테이블에 토스 컬럼 추가
--
-- LS 컬럼(ls_subscription_id 등) 은 그대로 유지 (롤백 가능성·기존 데이터 보존).
-- 토스 결제가 안정화되면 LS 컬럼은 별도 마이그레이션에서 제거.
--
-- 토스는 결제 단위로 paymentKey 가 생기고, 정기결제는 billing_key 로 청구한다.
-- 한 사용자가 LS·Toss 두 종류 구독을 동시에 가질 일은 없으므로 nullable 로 둔다.
-- =============================================================================

-- 기존 LS 컬럼들을 nullable 로 변경 (토스로 가입한 사용자는 ls_* 가 없음)
ALTER TABLE public.subscriptions
  ALTER COLUMN ls_subscription_id DROP NOT NULL,
  ALTER COLUMN ls_customer_id DROP NOT NULL,
  ALTER COLUMN ls_variant_id DROP NOT NULL;

-- subscription_status enum 에 past_due 추가 (토스 정기결제 실패 상태)
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'past_due';

-- 토스 빌링 정보
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS toss_billing_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS toss_customer_key text,
  ADD COLUMN IF NOT EXISTS toss_card_company text,
  ADD COLUMN IF NOT EXISTS toss_card_number_masked text,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'lemonsqueezy';

-- provider 컬럼: 어느 PG 로 결제 중인지 ('lemonsqueezy' | 'toss')
-- 기본값 lemonsqueezy 로 두면 기존 row 는 영향 X.

-- 결제 이력 — 정기결제 매월 청구 결과를 기록
CREATE TABLE IF NOT EXISTS public.toss_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payment_key text NOT NULL UNIQUE,
  order_id text NOT NULL UNIQUE,
  amount integer NOT NULL,
  status text NOT NULL, -- 'DONE' | 'CANCELED' | 'ABORTED' 등
  method text,
  approved_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  raw_response jsonb, -- 토스 응답 원본 (분쟁 시 증빙)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS toss_payments_user_id_idx
  ON public.toss_payments (user_id);
CREATE INDEX IF NOT EXISTS toss_payments_subscription_id_idx
  ON public.toss_payments (subscription_id);

-- RLS — 사용자는 자기 결제 이력만 조회 가능
ALTER TABLE public.toss_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "toss_payments_select_own"
  ON public.toss_payments FOR SELECT
  USING (auth.uid() = user_id);

-- service_role 만 INSERT/UPDATE — 사용자 직접 못 만듦 (서버 webhook 처리만)
-- (별도 INSERT 정책 없음 — service_role 은 RLS 우회 그대로)
