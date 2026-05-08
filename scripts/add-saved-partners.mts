/**
 * saved_partners 테이블 추가 마이그레이션.
 *
 * 실행: pnpm tsx scripts/add-saved-partners.mts
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

const DB_URL = env["DATABASE_URL"];
if (!DB_URL) throw new Error("DATABASE_URL not found in .env.local");

const sql = postgres(DB_URL, { ssl: "require", max: 1 });

await sql`
  CREATE TABLE IF NOT EXISTS saved_partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    relationship text DEFAULT '친구',
    birth_date date NOT NULL,
    calendar_system calendar_system NOT NULL DEFAULT 'solar',
    gender gender NOT NULL,
    mbti text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_partners_user_name_uniq UNIQUE (user_id, name)
  )
`;

await sql`CREATE INDEX IF NOT EXISTS saved_partners_user_idx ON saved_partners(user_id)`;

// RLS 활성화 + 기본 정책
await sql`ALTER TABLE saved_partners ENABLE ROW LEVEL SECURITY`;

await sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'saved_partners' AND policyname = 'saved_partners_owner_select'
    ) THEN
      CREATE POLICY saved_partners_owner_select ON saved_partners
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'saved_partners' AND policyname = 'saved_partners_owner_insert'
    ) THEN
      CREATE POLICY saved_partners_owner_insert ON saved_partners
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'saved_partners' AND policyname = 'saved_partners_owner_delete'
    ) THEN
      CREATE POLICY saved_partners_owner_delete ON saved_partners
        FOR DELETE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'saved_partners' AND policyname = 'saved_partners_owner_update'
    ) THEN
      CREATE POLICY saved_partners_owner_update ON saved_partners
        FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$;
`;

console.log("✅ saved_partners 테이블 + RLS 정책 적용 완료");

await sql.end();
process.exit(0);
