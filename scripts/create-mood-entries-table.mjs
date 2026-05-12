import postgres from "postgres";

const sql = postgres(
  "postgresql://postgres.rsffxhafktifmbaagrge:EV7qomsmBnEfAFuT@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
  { ssl: "require" },
);

await sql`
  CREATE TABLE IF NOT EXISTS public.mood_entries (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date   DATE        NOT NULL,
    mood         TEXT        NOT NULL,
    note         TEXT,
    source       TEXT        NOT NULL DEFAULT 'fortune',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT mood_entries_user_date_uniq UNIQUE (user_id, entry_date)
  )
`;
await sql`ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY`;
await sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mood_entries' AND policyname='mood_self_all') THEN
      CREATE POLICY mood_self_all ON public.mood_entries FOR ALL USING (auth.uid() = user_id);
    END IF;
  END $$
`;
await sql`CREATE INDEX IF NOT EXISTS mood_entries_user_date_idx ON public.mood_entries (user_id, entry_date DESC)`;

console.log("mood_entries 테이블 생성 완료");
await sql.end();
