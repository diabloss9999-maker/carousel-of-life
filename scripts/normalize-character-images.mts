/**
 * 캐릭터 이미지를 표준 비율(2:3, 1023x1537)로 정규화.
 *
 * 일부 이미지가 비표준 비율로 들어와 캐릭터 카드 정렬이 어긋나는 경우 사용.
 *
 * 실행: pnpm tsx scripts/normalize-character-images.mts
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const TARGET_WIDTH = 1023;
const TARGET_HEIGHT = 1537;

const ROOT = path.resolve(import.meta.dirname, "..");

const TARGETS = [
  "public/characters/shaman_night.png",
  "public/characters/taoist_night.png",
];

async function normalize(relPath: string): Promise<void> {
  const abs = path.join(ROOT, relPath);
  const before = await sharp(abs).metadata();
  console.log(`Before: ${relPath} — ${before.width}x${before.height}`);

  const buf = await sharp(abs)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: "cover",
      position: "center",
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(abs, buf);

  const after = await sharp(abs).metadata();
  console.log(`After:  ${relPath} — ${after.width}x${after.height}`);
}

for (const t of TARGETS) {
  await normalize(t);
}
console.log("\n완료.");
