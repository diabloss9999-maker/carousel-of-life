-- =============================================================================
-- DB 생성 누락 보강
--
-- 0004_rls_missing_tables.sql 이 RLS 정책을 적용하는 확장 기능 테이블들은
-- 일부가 과거 수동 스크립트로 생성되었다. 새 DB를 처음부터 만들 때도 같은
-- 구조가 보장되도록 0003 과 0004 사이에서 테이블을 먼저 만든다.
--
-- 기존 운영 DB에서는 모두 IF NOT EXISTS 로 처리되어 데이터 변경 없이 통과한다.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lenormand_spread'
  ) THEN
    CREATE TYPE public.lenormand_spread AS ENUM (
      'single',
      'three',
      'nine',
      'grand_tableau'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'rune_spread'
  ) THEN
    CREATE TYPE public.rune_spread AS ENUM (
      'single',
      'three',
      'five',
      'nine'
    );
  END IF;
END $$;

ALTER TYPE public.fortune_category ADD VALUE IF NOT EXISTS 'zodiac';
ALTER TYPE public.fortune_category ADD VALUE IF NOT EXISTS 'chinese_zodiac';

CREATE TABLE IF NOT EXISTS public.lenormand_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spread_type public.lenormand_spread NOT NULL,
  question text,
  cards jsonb NOT NULL,
  interpretation text NOT NULL,
  model text NOT NULL,
  gender text,
  significator_position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lenormand_readings_user_created_idx
  ON public.lenormand_readings (user_id, created_at);

CREATE TABLE IF NOT EXISTS public.rune_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spread_type public.rune_spread NOT NULL,
  question text,
  runes jsonb NOT NULL,
  reversed_enabled boolean NOT NULL DEFAULT true,
  interpretation text NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rune_readings_user_created_idx
  ON public.rune_readings (user_id, created_at);

CREATE TABLE IF NOT EXISTS public.saved_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text DEFAULT '친구',
  birth_date date NOT NULL,
  calendar_system public.calendar_system NOT NULL DEFAULT 'solar',
  gender public.gender NOT NULL,
  mbti text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_partners_user_name_uniq UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS saved_partners_user_idx
  ON public.saved_partners (user_id);

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_check_in date,
  bonus_gacha_credits integer NOT NULL DEFAULT 0,
  total_check_ins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_date date NOT NULL,
  character_id text NOT NULL,
  question text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_questions_user_date_uniq UNIQUE (user_id, question_date)
);

CREATE INDEX IF NOT EXISTS daily_questions_user_date_idx
  ON public.daily_questions (user_id, question_date);

CREATE TABLE IF NOT EXISTS public.world_cracks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  crack_score integer NOT NULL DEFAULT 0,
  total_accumulated integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  mood text NOT NULL,
  note text,
  source text NOT NULL DEFAULT 'fortune',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mood_entries_user_date_uniq UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS mood_entries_user_date_idx
  ON public.mood_entries (user_id, entry_date);

CREATE TABLE IF NOT EXISTS public.character_affinities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT character_affinities_user_char_uniq UNIQUE (user_id, character_id)
);

CREATE INDEX IF NOT EXISTS character_affinities_user_idx
  ON public.character_affinities (user_id);

CREATE TABLE IF NOT EXISTS public.daily_career_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_date date NOT NULL,
  tips jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_career_tips_user_date_uniq UNIQUE (user_id, tip_date)
);

CREATE TABLE IF NOT EXISTS public.daily_health_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date date NOT NULL,
  workouts jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_health_workouts_user_date_uniq UNIQUE (user_id, workout_date)
);

CREATE TABLE IF NOT EXISTS public.daily_study_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_date date NOT NULL,
  tips jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_study_tips_user_date_uniq UNIQUE (user_id, tip_date)
);

CREATE TABLE IF NOT EXISTS public.daily_love_premium (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  premium_date date NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_love_premium_user_date_uniq UNIQUE (user_id, premium_date)
);

CREATE TABLE IF NOT EXISTS public.daily_iljin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iljin_date date NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_iljin_user_date_uniq UNIQUE (user_id, iljin_date)
);

CREATE TABLE IF NOT EXISTS public.daily_general_premium (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  premium_date date NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_general_premium_user_date_uniq UNIQUE (user_id, premium_date)
);

CREATE TABLE IF NOT EXISTS public.personality_triple_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personality_stress_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personality_career_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
