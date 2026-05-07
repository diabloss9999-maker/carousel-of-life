/**
 * 운영자용: 사용자 비밀번호 강제 재설정.
 *
 * service_role 권한으로 Supabase Admin API 호출.
 *
 * 사용법:
 *   pnpm exec tsx scripts/reset-password.mts <email> <new-password>
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Supabase URL 또는 service role key 없음");
    process.exit(1);
  }

  const email = process.argv[2];
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.error("사용법: pnpm exec tsx scripts/reset-password.mts <email> <new-password>");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 이메일로 사용자 조회.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    console.error("사용자 조회 실패:", listError.message);
    process.exit(2);
  }
  const user = list.users.find((u) => u.email === email);
  if (!user) {
    console.error(`이메일 ${email} 사용자 없음`);
    process.exit(2);
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  });

  if (error) {
    console.error("비밀번호 재설정 실패:", error.message);
    process.exit(2);
  }

  console.log("✓ 비밀번호 재설정 완료");
  console.log(`  - email:    ${email}`);
  console.log(`  - user_id:  ${user.id}`);
  console.log(`  - password: ${newPassword}`);
  console.log("\n  ↗ 이 비밀번호로 바로 로그인할 수 있어요.");
}

main().catch((e) => {
  console.error("실행 실패:", e);
  process.exit(2);
});
