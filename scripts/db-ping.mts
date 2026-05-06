import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("NO_DATABASE_URL");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1, connect_timeout: 10, prepare: false });
  try {
    const rows = await sql<{ version: string; db: string }[]>`
      select version() as version, current_database() as db
    `;
    console.log("OK:", JSON.stringify(rows[0]));
    await sql.end();
    process.exit(0);
  } catch (e) {
    console.error("ERR:", e instanceof Error ? e.message : String(e));
    await sql.end({ timeout: 1 }).catch(() => {});
    process.exit(2);
  }
}
main();
