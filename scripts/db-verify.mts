import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const url = process.env.DATABASE_URL!;
const sql = postgres(url, { max: 1, prepare: false });

async function main() {
  console.log("\n=== 1) 테이블 목록 ===");
  const tables = await sql<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
     ORDER BY table_name
  `;
  for (const t of tables) console.log(`  - ${t.table_name}`);

  console.log("\n=== 2) RLS 활성화 상태 ===");
  const rls = await sql<{ tablename: string; rowsecurity: boolean }[]>`
    SELECT tablename, rowsecurity
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT LIKE '\\_%'
     ORDER BY tablename
  `;
  for (const r of rls) {
    const mark = r.rowsecurity ? "✓ ENABLED " : "✗ DISABLED";
    console.log(`  ${mark}  ${r.tablename}`);
  }

  console.log("\n=== 3) RLS 정책 개수 (테이블별) ===");
  const policies = await sql<{ tablename: string; count: string }[]>`
    SELECT tablename, count(*)::text
      FROM pg_policies
     WHERE schemaname = 'public'
     GROUP BY tablename
     ORDER BY tablename
  `;
  for (const p of policies) console.log(`  - ${p.tablename}: ${p.count} policies`);

  console.log("\n=== 4) Enum 타입 목록 ===");
  const enums = await sql<{ typname: string }[]>`
    SELECT typname FROM pg_type
     WHERE typtype = 'e'
       AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
     ORDER BY typname
  `;
  for (const e of enums) console.log(`  - ${e.typname}`);

  console.log("\n=== 5) 함수 / 트리거 ===");
  const functions = await sql<{ proname: string }[]>`
    SELECT proname FROM pg_proc
     WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
     ORDER BY proname
  `;
  for (const f of functions) console.log(`  - fn:  ${f.proname}`);

  const triggers = await sql<{ trigger_name: string; event_object_table: string }[]>`
    SELECT trigger_name, event_object_table FROM information_schema.triggers
     WHERE trigger_schema = 'public'
     ORDER BY trigger_name
  `;
  for (const t of triggers)
    console.log(`  - trg: ${t.trigger_name} on ${t.event_object_table}`);

  await sql.end();
}
main();
