-- =============================================================================
-- 친구 초대 시스템 — profiles 에 invited_by 컬럼 추가
--
-- 가입 시 ?ref={invitedBy_8chars} 로 들어온 사용자는 가입 완료 후 invited_by 에
-- 초대자의 user_id 가 기록된다.
-- 본인 추천은 금지 (애플리케이션 레벨에서 검증).
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_invited_by_idx
  ON public.profiles (invited_by)
  WHERE invited_by IS NOT NULL;

-- self-invite 방지 제약
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_no_self_invite
  CHECK (invited_by IS NULL OR invited_by <> user_id);
