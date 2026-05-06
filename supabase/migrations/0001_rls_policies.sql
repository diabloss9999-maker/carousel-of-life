-- =============================================================================
-- RLS (Row Level Security) 정책
-- 모든 user-owned 테이블은 본인 row 만 SELECT/INSERT/UPDATE/DELETE 가능.
-- service_role 은 RLS 를 우회하므로 webhook/관리 작업은 admin client 로 수행.
-- =============================================================================

-- profiles ---------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- daily_fortunes ---------------------------------------------------------
ALTER TABLE public.daily_fortunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_fortunes_select_own"
  ON public.daily_fortunes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_fortunes_insert_own"
  ON public.daily_fortunes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 운세는 한 번 생성되면 수정 불가 (오늘의 결과 변조 방지). DELETE 도 막음.

-- tarot_readings ---------------------------------------------------------
ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarot_readings_select_own"
  ON public.tarot_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tarot_readings_insert_own"
  ON public.tarot_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tarot_readings_delete_own"
  ON public.tarot_readings FOR DELETE
  USING (auth.uid() = user_id);

-- compatibility_readings -------------------------------------------------
ALTER TABLE public.compatibility_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compatibility_readings_select_own"
  ON public.compatibility_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "compatibility_readings_insert_own"
  ON public.compatibility_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "compatibility_readings_delete_own"
  ON public.compatibility_readings FOR DELETE
  USING (auth.uid() = user_id);

-- chat_sessions ----------------------------------------------------------
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_select_own"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_insert_own"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update_own"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_delete_own"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- chat_messages ----------------------------------------------------------
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_own"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_insert_own"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_messages_delete_own"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- subscriptions (구독은 webhook 으로만 갱신, 사용자는 읽기만) -----------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 는 service_role 만 가능 (webhook handler).

-- purchases (단건 결제도 webhook 갱신) ----------------------------------
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_select_own"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- usage_quotas (서버에서 SECURITY DEFINER 함수로만 증가) ---------------
ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_quotas_select_own"
  ON public.usage_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE 는 service_role 또는 SECURITY DEFINER 함수로만 수행.

-- webhook_events (전적으로 service_role 전용) --------------------------
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- 일반 사용자는 어떤 정책도 가지지 않음 (전체 차단).
