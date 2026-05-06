/**
 * 개발용: 운세·타로 캐시 + 일일 사용 카운터 리셋.
 *
 * 톤·페르소나 변경 후 새 결과를 받기 위해 사용한다.
 * 사용자 계정·프로필·구독은 건드리지 않는다.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL 없음");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [fortunes, tarots, quotas] = await Promise.all([
      sql`DELETE FROM daily_fortunes RETURNING id`,
      sql`DELETE FROM tarot_readings RETURNING id`,
      sql`
        UPDATE usage_quotas
           SET fortune_count = 0,
               tarot_count   = 0,
               chat_count    = 0
        RETURNING user_id
      `,
    ]);

    console.log(`✓ daily_fortunes 삭제: ${fortunes.length}건`);
    console.log(`✓ tarot_readings 삭제: ${tarots.length}건`);
    console.log(`✓ usage_quotas 리셋: ${quotas.length}건`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("리셋 실패:", e);
  process.exit(2);
});
