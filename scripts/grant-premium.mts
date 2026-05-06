/**
 * 개발자/운영자용: 본인 계정에 프리미엄 구독을 강제로 부여한다.
 *
 * - LS 결제 흐름 우회 (dev_grant 라는 가짜 subscription_id 사용)
 * - 1년 유효기간으로 active 구독 row INSERT/UPDATE
 * - hasActiveSubscription() 가 true 가 되어 모든 풀이 무제한
 *
 * 인자 없으면 profiles 첫 번째 사용자에게 부여.
 * 특정 이메일 지정: pnpm exec tsx scripts/grant-premium.mts user@example.com
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL 없음");
    process.exit(1);
  }

  const targetEmail = process.argv[2] ?? null;

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    let userRow:
      | { user_id: string; email: string | null; display_name: string | null }
      | undefined;

    if (targetEmail) {
      const rows = await sql<typeof userRow[]>`
        SELECT u.id AS user_id, u.email, p.display_name
          FROM auth.users u
          LEFT JOIN public.profiles p ON p.user_id = u.id
         WHERE u.email = ${targetEmail}
         LIMIT 1
      `;
      userRow = rows[0];
    } else {
      const rows = await sql<typeof userRow[]>`
        SELECT u.id AS user_id, u.email, p.display_name
          FROM public.profiles p
          JOIN auth.users u ON u.id = p.user_id
         ORDER BY p.created_at ASC
         LIMIT 1
      `;
      userRow = rows[0];
    }

    if (!userRow) {
      console.error("사용자를 찾지 못함");
      await sql.end();
      process.exit(2);
    }

    const variantId = process.env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID ?? "0";

    await sql`
      INSERT INTO public.subscriptions
        (user_id, ls_subscription_id, ls_customer_id, ls_variant_id,
         status, current_period_starts_at, current_period_ends_at,
         cancel_at_period_end)
      VALUES
        (${userRow.user_id}, 'dev_grant', 'dev_grant', ${variantId},
         'active', now(), now() + interval '1 year',
         false)
      ON CONFLICT (ls_subscription_id) DO UPDATE SET
        status = 'active',
        current_period_ends_at = now() + interval '1 year',
        cancel_at_period_end = false,
        ended_at = null,
        user_id = excluded.user_id,
        updated_at = now()
    `;

    console.log("✓ 프리미엄 부여 완료");
    console.log(`  - user_id:     ${userRow.user_id}`);
    console.log(`  - email:       ${userRow.email ?? "(없음)"}`);
    console.log(`  - 이름:         ${userRow.display_name ?? "(없음)"}`);
    console.log(`  - 만료일:       1년 후`);
    console.log("\n  → /settings 에서 '프리미엄 사용 중' 표시 확인");
    console.log("  → /today, /tarot, /chat 한도 무제한 적용");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("실패:", e);
  process.exit(2);
});
