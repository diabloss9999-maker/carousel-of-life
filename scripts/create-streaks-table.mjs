import postgres from "postgres";

const DATABASE_URL =
  "postgresql://postgres.rsffxhafktifmbaagrge:EV7qomsmBnEfAFuT@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

const sql = postgres(DATABASE_URL, { ssl: "require" });

await sql`
  CREATE TABLE IF NOT EXISTS public.streaks (
    user_id            UUID      PRIMARY KEY
                                 REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak     INTEGER   NOT NULL DEFAULT 0,
    longest_streak     INTEGER   NOT NULL DEFAULT 0,
    last_check_in      DATE,
    bonus_gacha_credits INTEGER  NOT NULL DEFAULT 0,
    total_check_ins    INTEGER   NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY`;

await sql`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'streaks' AND policyname = 'streaks_self_all'
    ) THEN
      CREATE POLICY streaks_self_all ON public.streaks
        FOR ALL USING (auth.uid() = user_id);
    END IF;
  END $$
`;

console.log("streaks 테이블 생성 완료");
await sql.end();
