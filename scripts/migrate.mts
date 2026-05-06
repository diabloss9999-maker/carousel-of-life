/**
 * 통합 마이그레이션 스크립트.
 *
 * 1) Drizzle 자동 생성 SQL (`src/db/migrations/`) — drizzle migrator 사용
 * 2) 추가 SQL (`supabase/migrations/`) — 자체 추적 테이블로 멱등 실행
 *
 * 멱등성: 두 번 실행해도 같은 결과를 보장한다.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const SUPABASE_MIGRATIONS_DIR = "supabase/migrations";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL 이 설정되지 않았음.");
    process.exit(1);
  }

  console.log("\n=== Step 1: Drizzle 마이그레이션 ===");
  {
    const sql = postgres(databaseUrl, { max: 1, prepare: false });
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "src/db/migrations" });
    await sql.end();
    console.log("✓ Drizzle migrate 완료");
  }

  console.log("\n=== Step 2: 추가 SQL (RLS · 트리거) 마이그레이션 ===");
  {
    const sql = postgres(databaseUrl, { max: 1, prepare: false });
    try {
      // 자체 추적 테이블.
      await sql`
        CREATE TABLE IF NOT EXISTS public._app_migrations (
          name text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      const files = (await readdir(SUPABASE_MIGRATIONS_DIR))
        .filter((f) => f.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const applied = await sql<{ count: string }[]>`
          SELECT count(*)::text FROM public._app_migrations WHERE name = ${file}
        `;
        if (Number(applied[0].count) > 0) {
          console.log(`- skip ${file} (already applied)`);
          continue;
        }

        const sqlText = await readFile(
          join(SUPABASE_MIGRATIONS_DIR, file),
          "utf8",
        );
        process.stdout.write(`- apply ${file} ... `);
        await sql.unsafe(sqlText);
        await sql`INSERT INTO public._app_migrations (name) VALUES (${file})`;
        console.log("done");
      }
      console.log("✓ 추가 SQL 마이그레이션 완료");
    } finally {
      await sql.end();
    }
  }

  console.log("\n=== 모든 마이그레이션 완료 ===\n");
  process.exit(0);
}

main().catch(async (e) => {
  console.error("\n마이그레이션 실패:", e);
  process.exit(2);
});
