-- =============================================================================
-- Lemon Squeezy(LS) 레거시 컬럼 제거
--
-- LS 결제 연동은 PortOne 으로 완전히 대체되어 더 이상 사용하지 않는다.
-- (SDK·API·웹훅·환경변수는 이전에 제거됨. 남아 있던 휴면 컬럼만 정리.)
-- 해당 컬럼은 운영 데이터로 채워진 적이 없어 안전하게 삭제한다.
-- UNIQUE 제약(subscriptions_ls_subscription_id_unique)은 컬럼과 함께 자동 삭제된다.
-- IF EXISTS 로 작성해 이미 제거된 환경에서도 안전하게 재실행 가능하다.
-- =============================================================================

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS ls_subscription_id,
  DROP COLUMN IF EXISTS ls_customer_id,
  DROP COLUMN IF EXISTS ls_variant_id;
