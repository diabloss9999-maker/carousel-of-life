-- 0020_member_nickname.sql
-- bubble 식 애칭(호칭) — 멤버가 나를 부르는 이름. 미설정 시 기본 "라이더".
-- 챗 프롬프트의 기본 호칭으로 주입된다.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS member_nickname text;
