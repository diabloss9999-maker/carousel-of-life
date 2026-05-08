/**
 * chat_sessions 테이블에 character 컬럼 추가.
 * pnpm tsx scripts/add-character-column.mts
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

await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS character text DEFAULT 'witch'`;
console.log("✅ chat_sessions.character 컬럼 추가 완료");

await sql.end();
process.exit(0);
