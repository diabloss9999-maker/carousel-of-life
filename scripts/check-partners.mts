import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const sql = postgres(env["DATABASE_URL"]!, { ssl: "require", max: 1 });
const rows = await sql`SELECT id, user_id, name, relationship, birth_date, gender, created_at FROM saved_partners ORDER BY created_at DESC LIMIT 5`;
console.log("saved_partners 최근 5개:", rows.length === 0 ? "없음" : rows);
await sql.end();
process.exit(0);
