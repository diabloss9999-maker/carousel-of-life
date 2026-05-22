/**
 * 개발자/운영자용: 본인 계정에 프리미엄 구독을 강제로 부여한다.
 *
 * - 결제 흐름 우회 (dev_grant 라는 가짜 subscription_id 사용)
 * - 1년 유효기간으로 active 구독 row INSERT/UPDATE
 * - hasActiveSubscription() 가 true 가 되어 모든 풀이 무제한
 *
 * 인자: 이메일 + (선택) 플랜
 *   pnpm tsx scripts/grant-premium.mts user@example.com       # 라이트(기본)
 *   pnpm tsx scripts/grant-premium.mts user@example.com pro   # 프로
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
  const plan = (process.argv[3] ?? "lite").toLowerCase();
  const planTag = plan === "pro" ? "pro" : "lite";

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

    // PortOne 채널/플랜 마커 — subscription-state 가 portone_payments.amount 로
    // 티어를 판단하므로, dev_grant 시 portone_payments 도 함께 한 줄 INSERT.
    const billingKey = `dev_grant_${planTag}`;
    const customerId = `dev_${userRow.user_id.slice(0, 8)}`;

    // subscriptions row upsert (portone 컬럼 사용)
    await sql`
      INSERT INTO public.subscriptions
        (user_id, provider, portone_billing_key, portone_customer_id,
         status, current_period_starts_at, current_period_ends_at,
         cancel_at_period_end)
      VALUES
        (${userRow.user_id}, 'portone', ${billingKey}, ${customerId},
         'active', now(), now() + interval '1 year',
         false)
      ON CONFLICT (portone_billing_key) DO UPDATE SET
        status = 'active',
        current_period_ends_at = now() + interval '1 year',
        cancel_at_period_end = false,
        ended_at = null,
        user_id = excluded.user_id,
        updated_at = now()
      RETURNING id
    `;

    // 가격 마커 — getSubscriptionTier 가 최신 결제 amount 로 판단
    const proPrice = Number(process.env.PORTONE_PRO_PRICE_KRW ?? 19900);
    const litePrice = Number(process.env.PORTONE_LITE_PRICE_KRW ?? 9900);
    const amount = planTag === "pro" ? proPrice : litePrice;
    const subRow = await sql<{ id: string }[]>`
      SELECT id FROM public.subscriptions
       WHERE user_id = ${userRow.user_id} AND provider = 'portone'
       ORDER BY created_at DESC LIMIT 1
    `;
    if (subRow[0]) {
      await sql`
        INSERT INTO public.portone_payments
          (user_id, subscription_id, payment_id, order_id, amount,
           status, paid_at)
        VALUES
          (${userRow.user_id}, ${subRow[0].id},
           ${`dev_grant_${planTag}_${Date.now()}`},
           ${`dev_grant_${planTag}_${Date.now()}`},
           ${amount}, 'PAID', now())
      `;
    }

    console.log("✓ 프리미엄 부여 완료");
    console.log(`  - user_id:     ${userRow.user_id}`);
    console.log(`  - email:       ${userRow.email ?? "(없음)"}`);
    console.log(`  - 이름:         ${userRow.display_name ?? "(없음)"}`);
    console.log(`  - 플랜:         ${planTag === "pro" ? "프로" : "라이트"}`);
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
