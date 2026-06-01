import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = postgres(databaseUrl, { ssl: "require" });

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
