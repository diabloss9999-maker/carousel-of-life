import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = postgres(databaseUrl, { ssl: "require" });

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
