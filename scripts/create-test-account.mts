/**
 * 카드사 사전심사용 테스트 계정 생성 스크립트.
 *
 * 절차:
 *   1. Supabase Admin API 로 이메일/비밀번호 계정 생성 (이메일 확인 skip)
 *   2. profiles row 자동 생성 (가짜 생년월일·성별)
 *   3. (선택) 라이트 구독 부여 — 결제 흐름 우회, premium 콘텐츠 확인용
 *
 * 카드사가 이 계정으로 로그인 → /pricing → 결제창 진입까지 확인 가능.
 *
 * 사용법:
 *   pnpm tsx scripts/create-test-account.mts
 *   pnpm tsx scripts/create-test-account.mts --premium     # 라이트 구독도 함께
 *   pnpm tsx scripts/create-test-account.mts --email=foo@bar.com --password=Test1234!
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

interface Args {
  email: string;
  password: string;
  premium: boolean;
}

function parseArgs(): Args {
  const args: Args = {
    email: "test-card-review@carouseloflife.com",
    password: "TestCard2026!",
    premium: false,
  };
  for (const a of process.argv.slice(2)) {
    if (a === "--premium") args.premium = true;
    else if (a.startsWith("--email=")) args.email = a.slice("--email=".length);
    else if (a.startsWith("--password="))
      args.password = a.slice("--password=".length);
  }
  return args;
}

async function main() {
  const args = parseArgs();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error(
      "환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL",
    );
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) 기존 같은 이메일 계정이 있으면 비밀번호만 재설정
  console.log(`\n[1/3] 계정 생성 — ${args.email}`);
  let userId: string;

  const existingByEmail = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (existingByEmail.error) {
    console.error("listUsers 실패:", existingByEmail.error);
    process.exit(2);
  }
  const existing = existingByEmail.data.users.find(
    (u) => u.email?.toLowerCase() === args.email.toLowerCase(),
  );

  if (existing) {
    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password: args.password,
      email_confirm: true,
    });
    if (updated.error) {
      console.error("updateUserById 실패:", updated.error);
      process.exit(2);
    }
    userId = existing.id;
    console.log(`  · 기존 계정 발견 — 비밀번호 재설정 완료 (${userId})`);
  } else {
    const created = await admin.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: {
        display_name: "카드사 심사용 테스트",
        purpose: "card-review",
      },
    });
    if (created.error || !created.data.user) {
      console.error("createUser 실패:", created.error);
      process.exit(2);
    }
    userId = created.data.user.id;
    console.log(`  · 새 계정 생성 완료 (${userId})`);
  }

  // 2) profiles row upsert (생년월일·성별 필수)
  console.log("[2/3] 프로필 생성·갱신");
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await sql`
      INSERT INTO public.profiles
        (user_id, display_name, birth_date, gender, calendar_system, birth_place)
      VALUES
        (${userId}, '카드사 심사용', '1990-01-01', 'other', 'solar', '서울')
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = excluded.display_name,
        birth_date = excluded.birth_date,
        gender = excluded.gender,
        updated_at = now()
    `;
    console.log("  · profiles upsert 완료");

    // 3) (옵션) 라이트 구독 부여
    if (args.premium) {
      console.log("[3/3] 라이트 구독 부여");
      const billingKey = "dev_grant_lite_cardreview";
      const customerId = `dev_${userId.slice(0, 8)}`;

      await sql`
        INSERT INTO public.subscriptions
          (user_id, provider, portone_billing_key, portone_customer_id,
           status, current_period_starts_at, current_period_ends_at,
           cancel_at_period_end)
        VALUES
          (${userId}, 'portone', ${billingKey}, ${customerId},
           'active', now(), now() + interval '1 year',
           false)
        ON CONFLICT (portone_billing_key) DO UPDATE SET
          status = 'active',
          user_id = excluded.user_id,
          current_period_ends_at = now() + interval '1 year',
          updated_at = now()
      `;

      const subRow = await sql<{ id: string }[]>`
        SELECT id FROM public.subscriptions
         WHERE user_id = ${userId} AND provider = 'portone'
         ORDER BY created_at DESC LIMIT 1
      `;
      if (subRow[0]) {
        const litePrice = Number(process.env.PORTONE_LITE_PRICE_KRW ?? 9900);
        const stamp = Date.now();
        await sql`
          INSERT INTO public.portone_payments
            (user_id, subscription_id, payment_id, order_id, amount,
             status, paid_at)
          VALUES
            (${userId}, ${subRow[0].id},
             ${`dev_grant_lite_cardreview_${stamp}`},
             ${`dev_grant_lite_cardreview_${stamp}`},
             ${litePrice}, 'PAID', now())
          ON CONFLICT DO NOTHING
        `;
      }
      console.log("  · 라이트 구독 부여 완료");
    } else {
      console.log("[3/3] 라이트 구독 부여 — skip (--premium 옵션 없음)");
    }
  } finally {
    await sql.end();
  }

  console.log("\n============================================");
  console.log("✓ 테스트 계정 준비 완료\n");
  console.log("  카드사 제공용 자격증명");
  console.log(`    이메일 : ${args.email}`);
  console.log(`    비밀번호: ${args.password}`);
  console.log(`    user_id: ${userId}`);
  console.log(
    `    플랜    : ${args.premium ? "라이트 (premium 콘텐츠 확인 가능)" : "무료 (결제 흐름 직접 시연)"}`,
  );
  console.log(
    "  로그인 URL: https://carouseloflife.com/login  (또는 staging URL)",
  );
  console.log("============================================\n");
}

main().catch((e) => {
  console.error("\n실패:", e);
  process.exit(2);
});
