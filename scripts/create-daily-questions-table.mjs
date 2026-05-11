import postgres from "postgres";

const DATABASE_URL =
  "postgresql://postgres.rsffxhafktifmbaagrge:EV7qomsmBnEfAFuT@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

const sql = postgres(DATABASE_URL, { ssl: "require" });

await sql`
  CREATE TABLE IF NOT EXISTS public.daily_questions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_date DATE        NOT NULL,
    character_id  TEXT        NOT NULL,
    question      TEXT        NOT NULL,
    model         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT daily_questions_user_date_uniq UNIQUE (user_id, question_date)
  )
`;

await sql`ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY`;

await sql`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'daily_questions' AND policyname = 'daily_questions_self_all'
    ) THEN
      CREATE POLICY daily_questions_self_all ON public.daily_questions
        FOR ALL USING (auth.uid() = user_id);
    END IF;
  END $$
`;

await sql`
  CREATE INDEX IF NOT EXISTS daily_questions_user_date_idx
    ON public.daily_questions (user_id, question_date)
`;

console.log("daily_questions 테이블 생성 완료");
await sql.end();
