/**
 * Lemon Squeezy 계정 자동 조회.
 *
 * - Store / Product / Variant 목록을 가져와서
 *   .env.local 에 채울 ID 들을 출력한다.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import {
  lemonSqueezySetup,
  listStores,
  listProducts,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

async function main() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    console.error("LEMONSQUEEZY_API_KEY 가 비어있음.");
    process.exit(1);
  }

  lemonSqueezySetup({
    apiKey,
    onError: (err) => {
      console.error("[LS error]", err.message);
    },
  });

  console.log("\n=== Stores ===");
  const stores = await listStores();
  if (stores.error || !stores.data) {
    console.error("Store 조회 실패:", stores.error?.message);
    process.exit(2);
  }
  for (const s of stores.data.data) {
    console.log(`  - id=${s.id}  name=${s.attributes.name}  status=${s.attributes.url}`);
  }

  console.log("\n=== Products ===");
  const products = await listProducts();
  if (products.error || !products.data) {
    console.error("Product 조회 실패:", products.error?.message);
    process.exit(2);
  }
  if (products.data.data.length === 0) {
    console.log("  (Product 없음 — 대시보드에서 만들어주세요)");
  }
  for (const p of products.data.data) {
    console.log(
      `  - id=${p.id}  name=${p.attributes.name}  price=${p.attributes.price_formatted}  status=${p.attributes.status}`,
    );
  }

  console.log("\n=== Variants ===");
  const variants = await listVariants();
  if (variants.error || !variants.data) {
    console.error("Variant 조회 실패:", variants.error?.message);
    process.exit(2);
  }
  if (variants.data.data.length === 0) {
    console.log("  (Variant 없음 — Product 안에 Variant 가 있어야 합니다)");
  }
  for (const v of variants.data.data) {
    console.log(
      `  - id=${v.id}  name=${v.attributes.name}  price=${v.attributes.price}  is_subscription=${v.attributes.is_subscription}  status=${v.attributes.status}`,
    );
  }

  console.log("\n=== .env.local 추천값 ===");
  if (stores.data.data[0]) {
    console.log(`LEMONSQUEEZY_STORE_ID=${stores.data.data[0].id}`);
  }
  const subVariant = variants.data.data.find(
    (v) => v.attributes.is_subscription && v.attributes.status === "published",
  );
  if (subVariant) {
    console.log(`LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID=${subVariant.id}`);
  } else if (variants.data.data[0]) {
    console.log(
      `# 첫 variant: ${variants.data.data[0].id} (subscription? ${variants.data.data[0].attributes.is_subscription})`,
    );
  }
}

main().catch((e) => {
  console.error("실행 실패:", e);
  process.exit(2);
});
