import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // 마이그레이션·스튜디오 명령에만 필요. 빌드 시점에는 호출되지 않으므로
  // 경고만 띄우고 계속 진행한다.
  console.warn(
    "[drizzle.config] DATABASE_URL 이 비어있습니다. .env.local 을 확인하세요.",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl ?? "postgresql://placeholder@localhost:5432/placeholder",
  },
  // auth, storage, realtime 등 Supabase 관리 schema 는 우리 마이그레이션 대상이 아님.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
