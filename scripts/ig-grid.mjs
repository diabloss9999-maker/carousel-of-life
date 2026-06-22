/**
 * 인스타 9멤버 인트로 이미지 (1080×1350, 4:5).
 * 멤버별 마스터(대표) 컷 — 얼굴이 가장 잘 드러나게 선별된 이미지로 3×3 그리드.
 */
import sharp from "sharp";

const ROOT = "C:/Users/User/projects/carousel-of-life/public";
// 캡션 순서(1 이안 … 9 하민)와 동일 + 멤버별 마스터 컷.
const MEMBERS = [
  "/characters/idols/performance/ian.webp",
  "/characters/idols/snaps/yujun-01-acoustic.webp",
  "/characters/idols/snaps/doyoon-03-red-stage.webp",
  "/characters/idols/snaps/jaeha-01-studio.webp",
  "/characters/idols/snaps/haru-01-denim.webp",
  "/characters/idols/snaps/sion-05-street.webp",
  "/characters/idols/snaps/theo-05-blue.webp",
  "/characters/idols/snaps/evan-05-portrait.webp",
  "/characters/idols/snaps/luhan-05-cardigan.webp",
];

const TILE = 360;
const COLS = 3;
const TITLE_H = 270;
const W = TILE * COLS; // 1080
const H = TITLE_H + TILE * COLS; // 1350
const BG = "#161019";

const tiles = await Promise.all(
  MEMBERS.map(async (rel, i) => {
    // 얼굴은 보통 상단~중앙 → position "top" 으로 머리/얼굴을 확실히 보존.
    const base = await sharp(ROOT + rel)
      .resize(TILE, TILE, { fit: "cover", position: "top" })
      .toBuffer();
    const n = i + 1;
    const badge = Buffer.from(
      `<svg width="${TILE}" height="${TILE}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="46" cy="46" r="30" fill="rgba(0,0,0,0.55)"/>
        <text x="46" y="59" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">${n}</text>
      </svg>`,
    );
    const withBadge = await sharp(base).composite([{ input: badge }]).toBuffer();
    return {
      input: withBadge,
      left: (i % COLS) * TILE,
      top: TITLE_H + Math.floor(i / COLS) * TILE,
    };
  }),
);

const title = Buffer.from(
  `<svg width="${W}" height="${TITLE_H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${TITLE_H}" fill="${BG}"/>
    <text x="${W / 2}" y="128" font-family="Malgun Gothic, sans-serif" font-size="82" font-weight="bold" fill="#f3e9d2" text-anchor="middle">캐러셀나인</text>
    <text x="${W / 2}" y="196" font-family="Malgun Gothic, sans-serif" font-size="40" fill="#c9a96a" text-anchor="middle">9명의 버추얼 아이돌 · 내 최애는?</text>
  </svg>`,
);

const OUT = "C:/Users/User/OneDrive/바탕 화면/carousel-nine-ig.jpg";
await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([{ input: title, left: 0, top: 0 }, ...tiles])
  .jpeg({ quality: 92 })
  .toFile(OUT);

console.log("DONE:", OUT);
