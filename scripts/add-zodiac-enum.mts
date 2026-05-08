import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const sql = postgres(env["DATABASE_URL"]!, { ssl: "require", max: 1 });
await sql`ALTER TYPE fortune_category ADD VALUE IF NOT EXISTS 'zodiac'`;
await sql`ALTER TYPE fortune_category ADD VALUE IF NOT EXISTS 'chinese_zodiac'`;
console.log("✅ fortune_category enum 확장 완료 (zodiac, chinese_zodiac)");
await sql.end();
process.exit(0);
