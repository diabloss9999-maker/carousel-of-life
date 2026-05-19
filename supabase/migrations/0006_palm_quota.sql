-- =============================================================================
-- 손금 풀이 일일 한도 — usage_quotas.palm_count + increment_usage_quota('palm')
--
-- 손금은 LITE+ 전용 (라이트 3회/일, 프로 5회/일).
-- 무료 사용자는 max=0 으로 호출되어 한도 초과로 막힘.
-- =============================================================================

ALTER TABLE public.usage_quotas
  ADD COLUMN IF NOT EXISTS palm_count integer NOT NULL DEFAULT 0;

-- increment_usage_quota 함수에 'palm' 분기 추가 (기존 함수 OR REPLACE).
CREATE OR REPLACE FUNCTION public.increment_usage_quota(
  p_user_id uuid,
  p_kind text,           -- 'fortune' | 'tarot' | 'chat' | 'palm'
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

  IF p_kind NOT IN ('fortune', 'tarot', 'chat', 'palm') THEN
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
  ELSIF p_kind = 'palm' THEN
    UPDATE public.usage_quotas
       SET palm_count = palm_count + 1
     WHERE user_id = p_user_id
       AND usage_date = v_today
       AND palm_count < p_max
     RETURNING palm_count INTO v_count;
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

-- 권한 (기존 grant 유지 차원에서 재선언).
GRANT EXECUTE ON FUNCTION public.increment_usage_quota(uuid, text, integer)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_usage_quota(uuid, text, integer)
  FROM anon, public;
