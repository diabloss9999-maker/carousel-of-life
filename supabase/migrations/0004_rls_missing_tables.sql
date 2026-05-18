-- =============================================================================
-- RLS 보강 — 0001 / 0003 에서 누락된 17개 user-owned 테이블
--
-- 이전 마이그레이션: profiles · daily_fortunes · tarot_readings ·
-- compatibility_readings · chat_sessions · chat_messages · subscriptions ·
-- purchases · usage_quotas · webhook_events · collection_cards · gacha_daily
-- 만 RLS 적용. 나머지 테이블들은 anon 키로 직접 조회 가능했음 (데이터 노출).
--
-- 정책: 각 테이블의 user_id 가 auth.uid() 와 일치하는 row 만 SELECT/INSERT/
--       UPDATE/DELETE 가능. service_role 은 RLS 우회 그대로.
-- =============================================================================

-- lenormand_readings ----------------------------------------------------
ALTER TABLE public.lenormand_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lenormand_readings_select_own"
  ON public.lenormand_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "lenormand_readings_insert_own"
  ON public.lenormand_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lenormand_readings_delete_own"
  ON public.lenormand_readings FOR DELETE
  USING (auth.uid() = user_id);

-- rune_readings ---------------------------------------------------------
ALTER TABLE public.rune_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rune_readings_select_own"
  ON public.rune_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "rune_readings_insert_own"
  ON public.rune_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rune_readings_delete_own"
  ON public.rune_readings FOR DELETE
  USING (auth.uid() = user_id);

-- saved_partners --------------------------------------------------------
ALTER TABLE public.saved_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_partners_select_own"
  ON public.saved_partners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_partners_insert_own"
  ON public.saved_partners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_partners_update_own"
  ON public.saved_partners FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_partners_delete_own"
  ON public.saved_partners FOR DELETE
  USING (auth.uid() = user_id);

-- streaks ---------------------------------------------------------------
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_own"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert_own"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_own"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- daily_questions -------------------------------------------------------
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_questions_select_own"
  ON public.daily_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_questions_insert_own"
  ON public.daily_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_questions_update_own"
  ON public.daily_questions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- world_cracks ----------------------------------------------------------
ALTER TABLE public.world_cracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_cracks_select_own"
  ON public.world_cracks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "world_cracks_insert_own"
  ON public.world_cracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "world_cracks_update_own"
  ON public.world_cracks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- mood_entries ----------------------------------------------------------
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_entries_select_own"
  ON public.mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mood_entries_insert_own"
  ON public.mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_entries_update_own"
  ON public.mood_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- character_affinities --------------------------------------------------
ALTER TABLE public.character_affinities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "character_affinities_select_own"
  ON public.character_affinities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "character_affinities_insert_own"
  ON public.character_affinities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "character_affinities_update_own"
  ON public.character_affinities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- daily_career_tips -----------------------------------------------------
ALTER TABLE public.daily_career_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_career_tips_select_own"
  ON public.daily_career_tips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_career_tips_insert_own"
  ON public.daily_career_tips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- daily_health_workouts -------------------------------------------------
ALTER TABLE public.daily_health_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_health_workouts_select_own"
  ON public.daily_health_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_health_workouts_insert_own"
  ON public.daily_health_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- daily_study_tips ------------------------------------------------------
ALTER TABLE public.daily_study_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_study_tips_select_own"
  ON public.daily_study_tips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_study_tips_insert_own"
  ON public.daily_study_tips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- daily_love_premium ----------------------------------------------------
ALTER TABLE public.daily_love_premium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_love_premium_select_own"
  ON public.daily_love_premium FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_love_premium_insert_own"
  ON public.daily_love_premium FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- daily_iljin -----------------------------------------------------------
ALTER TABLE public.daily_iljin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_iljin_select_own"
  ON public.daily_iljin FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_iljin_insert_own"
  ON public.daily_iljin FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- daily_general_premium -------------------------------------------------
ALTER TABLE public.daily_general_premium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_general_premium_select_own"
  ON public.daily_general_premium FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_general_premium_insert_own"
  ON public.daily_general_premium FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- personality_triple_analysis -------------------------------------------
ALTER TABLE public.personality_triple_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personality_triple_analysis_select_own"
  ON public.personality_triple_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "personality_triple_analysis_insert_own"
  ON public.personality_triple_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- personality_stress_profile --------------------------------------------
ALTER TABLE public.personality_stress_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personality_stress_profile_select_own"
  ON public.personality_stress_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "personality_stress_profile_insert_own"
  ON public.personality_stress_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- personality_career_fit ------------------------------------------------
ALTER TABLE public.personality_career_fit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personality_career_fit_select_own"
  ON public.personality_career_fit FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "personality_career_fit_insert_own"
  ON public.personality_career_fit FOR INSERT
  WITH CHECK (auth.uid() = user_id);
