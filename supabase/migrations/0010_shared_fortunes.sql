-- =============================================================================
-- 운세 공유 페이지 — shared_fortunes
--
-- 본인의 운세를 짧은 10자 base62 토큰으로 봉인 → 공유 URL.
-- 친구가 카카오톡으로 받은 링크를 클릭 → /share/fortune/[id] 미리보기 + 가입 CTA.
-- 가입 시 ?ref=invitedBy 쿼리로 친구 초대 시스템과 연동.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shared_fortunes (
  -- 10자 base62 short token. URL-safe, 추측 불가.
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category fortune_category NOT NULL,
  -- 운세 스냅샷 (운세가 갱신되어도 공유 페이지 유지).
  snapshot jsonb NOT NULL,
  -- 공유자 이름 노출 여부. 기본 익명.
  show_display_name boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_fortunes_user_id_idx
  ON public.shared_fortunes (user_id);

ALTER TABLE public.shared_fortunes ENABLE ROW LEVEL SECURITY;

-- 공개 — 토큰만 알면 누구나 SELECT 가능 (URL 자체가 인증)
CREATE POLICY "shared_fortunes_select_public"
  ON public.shared_fortunes FOR SELECT
  USING (true);

-- INSERT — 본인 row 만 생성 가능
CREATE POLICY "shared_fortunes_insert_own"
  ON public.shared_fortunes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE — 본인만 삭제 가능
CREATE POLICY "shared_fortunes_delete_own"
  ON public.shared_fortunes FOR DELETE
  USING (auth.uid() = user_id);

-- UPDATE 는 service_role 전용 (views 증가 등 — 익명 트래킹 차단)
