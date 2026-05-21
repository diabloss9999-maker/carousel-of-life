/**
 * 토스 테스트 결제 후 DB 상태 확인 스크립트.
 *
 * 실행:  pnpm tsx scripts/check-toss-test.mts
 *
 * 결과:
 *  - 최근 5개 subscriptions (provider, status, 토스 빌링키 등)
 *  - 최근 5개 toss_payments (결제 이력)
 */
import "dotenv/config";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 환경변수가 .env.local 에 없습니다.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: "require" });

async function main() {
  console.log("─── subscriptions (최근 5개) ───");
  const subs = await sql`
    SELECT id, user_id, provider, status,
           toss_billing_key, toss_card_company, toss_card_number_masked,
           current_period_starts_at, current_period_ends_at,
           cancel_at_period_end, created_at
    FROM public.subscriptions
    ORDER BY created_at DESC
    LIMIT 5
  `;
  for (const s of subs) {
    console.log({
      id: (s.id as string).slice(0, 8) + "...",
      provider: s.provider,
      status: s.status,
      toss_billing_key: s.toss_billing_key ? "✓ 있음" : "(없음)",
      card: s.toss_card_company
        ? `${s.toss_card_company} ${s.toss_card_number_masked}`
        : "(없음)",
      period: s.current_period_starts_at
        ? `${(s.current_period_starts_at as Date).toISOString().slice(0, 10)} ~ ${(s.current_period_ends_at as Date)?.toISOString().slice(0, 10)}`
        : "(없음)",
      cancelAtPeriodEnd: s.cancel_at_period_end,
    });
  }

  console.log("\n─── toss_payments (최근 5개) ───");
  const pays = await sql`
    SELECT id, user_id, subscription_id, payment_key, order_id, amount,
           status, method, approved_at, created_at
    FROM public.toss_payments
    ORDER BY created_at DESC
    LIMIT 5
  `;
  for (const p of pays) {
    console.log({
      orderId: p.order_id,
      amount: p.amount,
      status: p.status,
      method: p.method,
      approvedAt: (p.approved_at as Date)?.toISOString().slice(0, 19),
    });
  }

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
