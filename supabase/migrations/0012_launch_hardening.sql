-- =============================================================================
-- 출시 전 견고화 — planKey + pending_billing_issues
--
-- 1. subscriptions.plan_key — 가격이 바뀌어도 안전하게 plan 식별
--    (현재는 portone_payments.amount 로 추론하지만, 가격 변동·할인 시 깨짐)
-- 2. pending_billing_issues — issueId↔userId 사전 바인딩
--    callback URL 유출 시 다른 사용자 카드로 내 구독 생성 시나리오 차단
-- =============================================================================

-- 1) subscriptions.plan_key
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_key text;

COMMENT ON COLUMN public.subscriptions.plan_key IS
  'lite | pro. 가격 변동에 안전한 plan 식별자.';

-- 기존 행 백필 — 마지막 결제 amount 기준
UPDATE public.subscriptions s
  SET plan_key = COALESCE(
    (
      SELECT CASE WHEN pp.amount >= 9900 THEN 'pro' ELSE 'lite' END
        FROM public.portone_payments pp
       WHERE pp.subscription_id = s.id
       ORDER BY pp.created_at DESC
       LIMIT 1
    ),
    (
      SELECT CASE WHEN tp.amount >= 9900 THEN 'pro' ELSE 'lite' END
        FROM public.toss_payments tp
       WHERE tp.subscription_id = s.id
       ORDER BY tp.created_at DESC
       LIMIT 1
    ),
    'lite'
  )
  WHERE plan_key IS NULL;

-- 2) pending_billing_issues
CREATE TABLE IF NOT EXISTS public.pending_billing_issues (
  issue_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('lite', 'pro')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_billing_issues_user_idx
  ON public.pending_billing_issues (user_id);
CREATE INDEX IF NOT EXISTS pending_billing_issues_expires_idx
  ON public.pending_billing_issues (expires_at);

ALTER TABLE public.pending_billing_issues ENABLE ROW LEVEL SECURITY;

-- INSERT·SELECT·DELETE 모두 service_role 만 — 클라이언트는 API 경유
-- (정책을 명시적으로 만들지 않으면 RLS 가 모두 차단 → service_role 만 통과)
