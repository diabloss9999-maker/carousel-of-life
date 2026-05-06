-- =============================================================================
-- 트리거 및 헬퍼 함수
-- =============================================================================

-- ---------------------------------------------------------------------------
-- updated_at 자동 갱신 트리거 함수
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_usage_quotas_set_updated_at
  BEFORE UPDATE ON public.usage_quotas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 일일 사용량 증가 헬퍼 (SECURITY DEFINER)
-- 무료 한도 체크 + 카운터 증가를 한 번에 원자적으로 수행한다.
-- 한도 초과 시 NULL 반환. 클라이언트는 NULL 일 때 결제 유도.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_usage_quota(
  p_user_id uuid,
  p_kind text,           -- 'fortune' | 'tarot' | 'chat'
  p_max integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_count integer;
BEGIN
  -- 호출자 권한 검증: 본인의 user_id 만 증가 가능.
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF p_kind NOT IN ('fortune', 'tarot', 'chat') THEN
    RAISE EXCEPTION 'invalid kind: %', p_kind;
  END IF;

  -- upsert 로 row 보장.
  INSERT INTO public.usage_quotas (user_id, usage_date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- 카운터 증가 + 한도 체크 (원자적).
  IF p_kind = 'fortune' THEN
    UPDATE public.usage_quotas
       SET fortune_count = fortune_count + 1
     WHERE user_id = p_user_id
       AND usage_date = v_today
       AND fortune_count < p_max
     RETURNING fortune_count INTO v_count;
  ELSIF p_kind = 'tarot' THEN
    UPDATE public.usage_quotas
       SET tarot_count = tarot_count + 1
     WHERE user_id = p_user_id
       AND usage_date = v_today
       AND tarot_count < p_max
     RETURNING tarot_count INTO v_count;
  ELSE
    UPDATE public.usage_quotas
       SET chat_count = chat_count + 1
     WHERE user_id = p_user_id
       AND usage_date = v_today
       AND chat_count < p_max
     RETURNING chat_count INTO v_count;
  END IF;

  RETURN v_count;  -- NULL 이면 한도 초과.
END;
$$;

-- 인증된 사용자만 호출 가능.
GRANT EXECUTE ON FUNCTION public.increment_usage_quota(uuid, text, integer)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_usage_quota(uuid, text, integer)
  FROM anon, public;

-- ---------------------------------------------------------------------------
-- 인증된 사용자의 활성 구독 여부 확인 헬퍼
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_subscribed(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.subscriptions
     WHERE user_id = p_user_id
       AND status IN ('active', 'on_trial')
       AND (current_period_ends_at IS NULL
            OR current_period_ends_at > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_subscribed(uuid)
  TO authenticated, anon;
