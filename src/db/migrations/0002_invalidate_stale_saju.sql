-- 사주 계산을 AI(Claude Haiku) 기반에서 lunar-typescript 결정론적 알고리즘으로 교체.
-- 이전 AI 시절 캐시된 saju_pillars / five_elements / saju_deep_reading 은
-- 잘못된 만세력일 수 있으므로 일괄 NULL 로 무효화한다.
--
-- 무효화된 행은 다음 사주 조회 시 ensureSajuCalculated() 가 자동 재계산 + 저장.
-- 결정론적 알고리즘이므로 동일 입력에 동일 결과가 보장된다.
UPDATE "profiles"
SET
  "saju_pillars" = NULL,
  "five_elements" = NULL,
  "saju_deep_reading" = NULL;
