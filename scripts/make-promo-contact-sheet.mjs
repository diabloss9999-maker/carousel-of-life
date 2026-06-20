import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const out = path.join(root, "promo", "promo-image-candidates.jpg");
const candidates = [
  "public/characters/idols/group-editorial/group-editorial-03-black-stage.png",
  "public/characters/idols/group-editorial/group-editorial-06-street-night.png",
  "public/characters/idols/group-editorial/group-editorial-08-red-carpet.png",
  "public/characters/idols/group-editorial/group-editorial-10-racing-editorial.png",
  "public/characters/idols/editorial/yujun-editorial.webp",
  "public/characters/idols/editorial/sion-editorial.webp",
  "public/characters/idols/editorial/theo-editorial.webp",
  "public/characters/idols/editorial/haru-editorial.webp",
  "public/characters/idols/editorial/jaeha-editorial.webp",
  "public/characters/idols/editorial/ihyun-editorial.webp",
  "public/characters/idols/editorial/hamin-editorial.webp",
  "public/characters/idols/snaps/doyoon-03-red-stage.webp",
  "public/characters/idols/snaps/evan-01-suit.webp",
  "public/characters/idols/snaps/haru-02-color-stage.webp",
  "public/characters/idols/snaps/ian-03-hiphop.webp",
  "public/characters/idols/snaps/jaeha-01-studio.webp",
  "public/characters/idols/snaps/luhan-01-blue.webp",
  "public/characters/idols/snaps/sion-01-night.webp",
  "public/characters/idols/snaps/theo-02-stage.webp",
  "public/characters/idols/snaps/yujun-05-stage.webp",
];

const tileW = 300;
const tileH = 420;
const cols = 5;
const rows = Math.ceil(candidates.length / cols);

await fs.mkdir(path.dirname(out), { recursive: true });

const composites = [];
for (let i = 0; i < candidates.length; i++) {
  const file = candidates[i];
  const x = (i % cols) * tileW;
  const y = Math.floor(i / cols) * tileH;
  const img = await sharp(path.join(root, file))
    .resize(tileW, tileH - 48, { fit: "cover", position: "north" })
    .jpeg({ quality: 92 })
    .toBuffer();
  const label = Buffer.from(`<svg width="${tileW}" height="48" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#111"/>
<text x="10" y="29" font-family="Arial, sans-serif" font-size="15" fill="#fff">${i + 1}. ${path.basename(file)}</text>
</svg>`);
  composites.push({ input: img, left: x, top: y });
  composites.push({ input: label, left: x, top: y + tileH - 48 });
}

await sharp({
  create: {
    width: tileW * cols,
    height: tileH * rows,
    channels: 3,
    background: "#202020",
  },
})
  .composite(composites)
  .jpeg({ quality: 94 })
  .toFile(out);

console.log(out);
