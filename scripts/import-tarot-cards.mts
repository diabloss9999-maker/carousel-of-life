/**
 * GPT 에서 다운로드한 타로 카드 이미지를 public/tarot/ 에 자동 복사.
 *
 * 사용법:
 *   pnpm tsx scripts/import-tarot-cards.mts [카드_id]
 *
 * 예시 (최신 다운로드 파일을 the_high_priestess.png 로 복사):
 *   pnpm tsx scripts/import-tarot-cards.mts the_high_priestess
 *
 * 인수 없이 실행하면 아직 없는 카드 ID 목록을 출력.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const DOWNLOADS = path.join(os.homedir(), "Downloads");
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_TAROT = path.resolve(SCRIPT_DIR, "../public/tarot");

/** 78장 전체 ID 순서 (메이저 → 마이너 컵/완드/소드/펜타클). */
const ALL_IDS: string[] = [
  // Major Arcana 0-21
  "the_fool", "the_magician", "the_high_priestess", "the_empress",
  "the_emperor", "the_hierophant", "the_lovers", "the_chariot",
  "strength", "the_hermit", "wheel_of_fortune", "justice",
  "the_hanged_man", "death", "temperance", "the_devil",
  "the_tower", "the_star", "the_moon", "the_sun",
  "judgement", "the_world",
  // Cups 1-14
  "cups_1","cups_2","cups_3","cups_4","cups_5","cups_6","cups_7",
  "cups_8","cups_9","cups_10","cups_page","cups_knight","cups_queen","cups_king",
  // Wands 1-14
  "wands_1","wands_2","wands_3","wands_4","wands_5","wands_6","wands_7",
  "wands_8","wands_9","wands_10","wands_page","wands_knight","wands_queen","wands_king",
  // Swords 1-14
  "swords_1","swords_2","swords_3","swords_4","swords_5","swords_6","swords_7",
  "swords_8","swords_9","swords_10","swords_page","swords_knight","swords_queen","swords_king",
  // Pentacles 1-14
  "pentacles_1","pentacles_2","pentacles_3","pentacles_4","pentacles_5","pentacles_6","pentacles_7",
  "pentacles_8","pentacles_9","pentacles_10","pentacles_page","pentacles_knight","pentacles_queen","pentacles_king",
];

/** Downloads 폴더에서 가장 최근의 ChatGPT Image .png 파일 경로 반환. */
function latestDownload(): string | null {
  const entries = fs
    .readdirSync(DOWNLOADS)
    .filter((f) => f.startsWith("ChatGPT Image") && f.endsWith(".png"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(DOWNLOADS, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return entries.length > 0 ? path.join(DOWNLOADS, entries[0].name) : null;
}

/** 이미 고해상도(1024×1536) 인지 검증. */
function isHighRes(filePath: string): boolean {
  // PNG IHDR 청크에서 width/height 파싱 (Byte 16-23).
  const buf = Buffer.alloc(24);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return w >= 512 && h >= 768; // 최소 512×768 이상
}

function main() {
  const cardId = process.argv[2];

  if (!cardId) {
    // 인수 없음 → 아직 소해상도(<512px)인 카드 목록 출력.
    console.log("━".repeat(50));
    console.log("📋 아직 고해상도로 교체 안 된 카드:");
    console.log("━".repeat(50));
    let count = 0;
    for (const id of ALL_IDS) {
      const dest = path.join(PUBLIC_TAROT, `${id}.png`);
      if (!fs.existsSync(dest) || !isHighRes(dest)) {
        console.log(`  pnpm tsx scripts/import-tarot-cards.mts ${id}`);
        count++;
      }
    }
    console.log("━".repeat(50));
    console.log(`남은 카드: ${count}장 / 78장`);
    return;
  }

  if (!ALL_IDS.includes(cardId)) {
    console.error(`❌ 알 수 없는 카드 ID: ${cardId}`);
    console.log("사용 가능한 ID:", ALL_IDS.join(", "));
    process.exit(1);
  }

  const src = latestDownload();
  if (!src) {
    console.error("❌ Downloads 폴더에서 ChatGPT Image .png 를 찾을 수 없어.");
    process.exit(1);
  }

  const dest = path.join(PUBLIC_TAROT, `${cardId}.png`);
  fs.copyFileSync(src, dest);

  const hi = isHighRes(dest);
  console.log(`✅ ${path.basename(src)} → public/tarot/${cardId}.png ${hi ? "(고해상도)" : "⚠️ 저해상도"}`);

  // 복사 후 Downloads 의 원본 삭제 여부 물어보지 않고 그냥 둠.
  // git 에 반영하려면 프로젝트 루트에서 git add + commit 필요.
  console.log(`\n다음 단계:\n  git add public/tarot/${cardId}.png\n  git commit -m "feat: 타로 카드 이미지 ${cardId}"\n  git push`);
}

main();
