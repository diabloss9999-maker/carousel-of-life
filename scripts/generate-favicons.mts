/**
 * 브랜드 로고 PNG 를 favicon / app icon 등 다양한 크기로 변환.
 *
 * 입력:  logo-source.png (정사각 권장, 512px 이상)
 * 출력:
 *   - src/app/icon.png       (512x512, PWA + 기본 favicon)
 *   - src/app/apple-icon.png (180x180, iOS bookmark)
 *   - src/app/favicon.ico    (16/32/48 멀티 사이즈 ICO, Google 검색 호환)
 *
 * 실행: pnpm tsx scripts/generate-favicons.mts
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import pngToIco from "png-to-ico";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "logo-source.png");

async function ensureSource(): Promise<void> {
  try {
    await fs.access(SOURCE);
  } catch {
    throw new Error(`Source logo not found at ${SOURCE}`);
  }
}

/**
 * 정사각 크기로 리사이즈한 PNG 버퍼 생성.
 */
async function pngBuffer(size: number): Promise<Buffer> {
  return sharp(SOURCE)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePng(size: number, outPath: string): Promise<void> {
  const buf = await pngBuffer(size);
  await fs.writeFile(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`✓ ${path.relative(ROOT, outPath)} — ${size}px (${kb} KB)`);
}

async function writeIco(): Promise<void> {
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(sizes.map(pngBuffer));
  const ico = await pngToIco(buffers);
  const outPath = path.join(ROOT, "src/app/favicon.ico");
  await fs.writeFile(outPath, ico);
  const kb = (ico.length / 1024).toFixed(1);
  console.log(`✓ ${path.relative(ROOT, outPath)} — 16/32/48px ICO (${kb} KB)`);
}

async function main(): Promise<void> {
  await ensureSource();
  await writePng(512, path.join(ROOT, "src/app/icon.png"));
  await writePng(180, path.join(ROOT, "src/app/apple-icon.png"));
  await writeIco();
  console.log("\n완료.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
