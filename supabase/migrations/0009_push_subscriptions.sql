-- =============================================================================
-- 웹 푸시 알림 구독 — push_subscriptions
--
-- 사용자가 브라우저에서 알림 권한 허용 + Subscribe → 한 행 추가.
-- 매일 cron 이 이 테이블 순회하며 매일 운세 알림 발송.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  last_sent_at timestamptz,
  error_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 구독만 조회·삭제 가능 (디바이스 토글 등)
CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT/UPDATE 는 service_role 만 (서버 API 경유)
