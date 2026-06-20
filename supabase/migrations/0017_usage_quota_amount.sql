-- Unified fortune/divination/saju quota with variable point cost.
-- fortune group costs 1 point; divination and saju tools can cost 2 points.

CREATE OR REPLACE FUNCTION public.increment_usage_quota_v2(
  p_user_id uuid,
  p_kind text,           -- 'fortune' | 'chat'
  p_max integer,
  p_amount integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_count integer;
  v_amount integer := greatest(1, p_amount);
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF p_kind NOT IN ('fortune', 'chat') THEN
    RAISE EXCEPTION 'invalid kind: %', p_kind;
  END IF;

  INSERT INTO public.usage_quotas (user_id, usage_date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  IF p_kind = 'fortune' THEN
    UPDATE public.usage_quotas
       SET fortune_count = fortune_count + v_amount
     WHERE user_id = p_user_id
       AND usage_date = v_today
       AND fortune_count + v_amount <= p_max
     RETURNING fortune_count INTO v_count;
  ELSE
    UPDATE public.usage_quotas
       SET chat_count = chat_count + v_amount
     WHERE user_id = p_user_id
       AND usage_date = v_today
       AND chat_count + v_amount <= p_max
     RETURNING chat_count INTO v_count;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_usage_quota_v2(uuid, text, integer, integer)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_usage_quota_v2(uuid, text, integer, integer)
  FROM anon, public;
