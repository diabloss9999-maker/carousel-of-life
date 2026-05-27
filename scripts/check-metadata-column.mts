/**
 * chat_messages.metadata 컬럼 존재 여부 확인 + 없으면 안내.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, key);

async function main() {
  // 컬럼 정보 PostgreSQL information_schema 로 조회
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, metadata")
    .limit(1);

  if (error) {
    console.error("ERROR:", error.message);
    console.error("CODE:", error.code);
    console.error("DETAILS:", error.details);
    if (error.message.includes("metadata")) {
      console.log("\n>>> metadata 컬럼이 DB 에 없습니다. 마이그레이션 0013 적용 필요.");
    }
    process.exit(1);
  }

  console.log("OK — metadata 컬럼 존재. 샘플 row:", data);
}

main().catch((e) => {
  console.error("EXCEPTION:", e);
  process.exit(1);
});
