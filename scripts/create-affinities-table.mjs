import postgres from "postgres";

const sql = postgres(
  "postgresql://postgres.rsffxhafktifmbaagrge:EV7qomsmBnEfAFuT@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
  { ssl: "require" },
);

await sql`
  CREATE TABLE IF NOT EXISTS public.character_affinities (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id TEXT        NOT NULL,
    points       INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT character_affinities_user_char_uniq UNIQUE (user_id, character_id)
  )
`;

await sql`ALTER TABLE public.character_affinities ENABLE ROW LEVEL SECURITY`;

await sql`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'character_affinities' AND policyname = 'affinities_self_all'
    ) THEN
      CREATE POLICY affinities_self_all ON public.character_affinities
        FOR ALL USING (auth.uid() = user_id);
    END IF;
  END $$
`;

await sql`
  CREATE INDEX IF NOT EXISTS affinities_user_idx
    ON public.character_affinities (user_id)
`;

console.log("character_affinities 테이블 생성 완료");
await sql.end();
