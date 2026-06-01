import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = postgres(databaseUrl, { ssl: "require" });

await sql`
  CREATE TABLE IF NOT EXISTS public.world_cracks (
    user_id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    crack_score       INTEGER     NOT NULL DEFAULT 0,
    total_accumulated INTEGER     NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;
await sql`ALTER TABLE public.world_cracks ENABLE ROW LEVEL SECURITY`;
await sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='world_cracks' AND policyname='cracks_self_all') THEN
      CREATE POLICY cracks_self_all ON public.world_cracks FOR ALL USING (auth.uid() = user_id);
    END IF;
  END $$
`;

console.log("world_cracks 테이블 생성 완료");
await sql.end();
