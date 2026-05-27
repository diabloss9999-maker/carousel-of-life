/**
 * Supabase 에 0013_chat_message_metadata.sql 마이그레이션 적용.
 *
 * postgres-js 로 직접 ALTER TABLE 실행. service role 권한 필요.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { readFileSync } from "node:fs";

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("DATABASE_URL 또는 SUPABASE_DB_URL 환경변수 필요");
  process.exit(1);
}

const sql = postgres(dbUrl, { max: 1 });

async function main() {
  const migration = readFileSync(
    "supabase/migrations/0013_chat_message_metadata.sql",
    "utf-8",
  );
  console.log(">>> 적용할 SQL:");
  console.log(migration);
  console.log("\n>>> 실행 중...");

  await sql.unsafe(migration);

  // 검증
  const check = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'metadata'
  `;

  if (check.length > 0) {
    console.log("\nOK — metadata 컬럼 확인됨:", check[0]);
  } else {
    console.error("\nFAILED — 컬럼이 생성되지 않음");
    process.exit(1);
  }

  await sql.end();
}

main().catch(async (e) => {
  console.error("EXCEPTION:", e);
  await sql.end().catch(() => {});
  process.exit(1);
});
