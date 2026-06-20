-- =============================================================================
-- 보안 강화 — public 스키마 RLS 정리 (Supabase Security Advisor 대응)
--
-- 1) _app_migrations: 마이그레이션 추적 테이블. RLS 가 꺼져 있어 anon REST API 로
--    노출됨(rls_disabled_in_public). 민감 데이터는 아니지만 외부 접근을 차단한다.
--    정책을 두지 않으므로 anon/authenticated 는 접근 불가. 서버(직접 연결/service_role)는
--    RLS 를 우회하므로 마이그레이션 추적은 그대로 동작한다.
--
-- 2) rsffxhafktifmbeagrge: 정식 스키마·코드 어디에도 없는 정체불명 테이블.
--    점검 결과 이미 존재하지 않지만, 혹시 남아 있으면 함께 제거한다(IF EXISTS — 멱등).
-- =============================================================================

ALTER TABLE IF EXISTS public._app_migrations ENABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public.rsffxhafktifmbeagrge;
