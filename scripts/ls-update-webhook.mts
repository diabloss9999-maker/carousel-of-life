/**
 * Lemon Squeezy Webhook URL 자동 업데이트.
 *
 * 사용법:
 *   pnpm exec tsx scripts/ls-update-webhook.mts <new-url>
 *
 * 인자 없으면 NEXT_PUBLIC_APP_URL 기준 + /api/webhooks/lemonsqueezy 자동 조립.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const apiKey = process.env.LEMONSQUEEZY_API_KEY;
if (!apiKey) {
  console.error("LEMONSQUEEZY_API_KEY 가 비어있음.");
  process.exit(1);
}

const newUrl =
  process.argv[2] ??
  `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://carousel-of-life-k5hs.vercel.app"}/api/webhooks/lemonsqueezy`;

console.log(`타겟 URL: ${newUrl}\n`);

interface WebhookListItem {
  id: string;
  attributes: {
    url: string;
    events: string[];
    test_mode: boolean;
  };
}

async function main() {
  // 1) 모든 webhook 조회.
  const listRes = await fetch("https://api.lemonsqueezy.com/v1/webhooks", {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!listRes.ok) {
    console.error("Webhook 조회 실패:", listRes.status, await listRes.text());
    process.exit(2);
  }
  const list = (await listRes.json()) as { data: WebhookListItem[] };

  if (list.data.length === 0) {
    console.error("등록된 webhook 이 없음.");
    process.exit(2);
  }

  console.log(`발견된 webhook ${list.data.length}개:`);
  list.data.forEach((w) => {
    console.log(`  - id=${w.id}  url=${w.attributes.url}  events=${w.attributes.events.length}개`);
  });

  // 2) 모든 webhook 의 URL 을 새 URL 로 업데이트.
  for (const webhook of list.data) {
    if (webhook.attributes.url === newUrl) {
      console.log(`\n✓ id=${webhook.id} 는 이미 최신 URL`);
      continue;
    }

    const patchRes = await fetch(
      `https://api.lemonsqueezy.com/v1/webhooks/${webhook.id}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: "webhooks",
            id: webhook.id,
            attributes: { url: newUrl },
          },
        }),
      },
    );

    if (!patchRes.ok) {
      console.error(
        `\n✗ id=${webhook.id} 업데이트 실패:`,
        patchRes.status,
        await patchRes.text(),
      );
      process.exit(2);
    }
    console.log(`\n✓ id=${webhook.id} URL 업데이트 완료 → ${newUrl}`);
  }
}

main().catch((e) => {
  console.error("실행 실패:", e);
  process.exit(2);
});
