/**
 * 배경 이미지 PNG → WebP 일괄 변환.
 *
 * 사용: node scripts/convert-backgrounds.mjs
 *
 * - 원본 PNG 는 유지 (롤백 가능)
 * - quality 80 으로 손실 압축 — 시각 차이 거의 없음
 * - 결과 크기: 평균 70~85% 감소 예상
 */
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const BG_DIR = "public/backgrounds";

async function main() {
  const files = await readdir(BG_DIR);
  const pngs = files.filter((f) => f.endsWith(".png"));

  let totalIn = 0;
  let totalOut = 0;
  const results = [];

  for (const file of pngs) {
    const inPath = join(BG_DIR, file);
    const outPath = inPath.replace(/\.png$/, ".webp");
    const inSize = (await stat(inPath)).size;

    await sharp(inPath).webp({ quality: 80, effort: 5 }).toFile(outPath);
    const outSize = (await stat(outPath)).size;

    totalIn += inSize;
    totalOut += outSize;
    const reduction = (((inSize - outSize) / inSize) * 100).toFixed(1);
    results.push(
      `${file}: ${(inSize / 1024 / 1024).toFixed(2)}MB → ${(outSize / 1024 / 1024).toFixed(2)}MB (-${reduction}%)`,
    );
  }

  console.log(results.join("\n"));
  console.log(
    `\nTOTAL: ${(totalIn / 1024 / 1024).toFixed(2)}MB → ${(totalOut / 1024 / 1024).toFixed(2)}MB ` +
      `(-${(((totalIn - totalOut) / totalIn) * 100).toFixed(1)}%)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
