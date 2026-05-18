/**
 * 임의 폴더의 PNG/JPG 를 WebP 로 일괄 변환 + 원본 삭제.
 *
 * 사용: node scripts/convert-folder-to-webp.mjs public/tarot
 *      node scripts/convert-folder-to-webp.mjs public/collection
 *
 * - 변환 quality 80, effort 5
 * - 원본 (.png/.jpg/.jpeg) 자동 삭제
 * - 결과: 종합 크기 변화 출력
 */
import sharp from "sharp";
import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/convert-folder-to-webp.mjs <dir>");
  process.exit(1);
}

async function main() {
  const files = await readdir(dir);
  const sources = files.filter((f) => /\.(png|jpe?g)$/i.test(f));

  let totalIn = 0;
  let totalOut = 0;

  for (const file of sources) {
    const inPath = join(dir, file);
    const outPath = inPath.replace(/\.(png|jpe?g)$/i, ".webp");
    const inSize = (await stat(inPath)).size;

    await sharp(inPath).webp({ quality: 80, effort: 5 }).toFile(outPath);
    const outSize = (await stat(outPath)).size;
    await unlink(inPath);

    totalIn += inSize;
    totalOut += outSize;
    const reduction = (((inSize - outSize) / inSize) * 100).toFixed(1);
    process.stdout.write(
      `${file} → .webp  ${(inSize / 1024 / 1024).toFixed(2)}→${(outSize / 1024 / 1024).toFixed(2)}MB (-${reduction}%)\n`,
    );
  }

  console.log(
    `\nTOTAL ${dir}: ${(totalIn / 1024 / 1024).toFixed(1)}MB → ${(totalOut / 1024 / 1024).toFixed(1)}MB ` +
      `(-${(((totalIn - totalOut) / totalIn) * 100).toFixed(1)}%) on ${sources.length} files`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
