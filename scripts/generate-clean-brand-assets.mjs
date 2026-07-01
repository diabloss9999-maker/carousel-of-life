import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();

const colors = {
  ink: "#171717",
  charcoal: "#3F3F46",
  paper: "#FFFFFF",
  warmPaper: "#FBFAF7",
  line: "#E7E2D8",
  gold: "#B9954A",
  goldSoft: "#D7B86E",
  bone: "#171717",
  mist: "#71717A",
};

const iconSvg = (size = 512, maskable = false) => {
  const pad = maskable ? 0 : 28;
  const inner = size - pad * 2;
  const c = size / 2;
  const r = inner * 0.34;
  const smallR = inner * 0.235;
  const star = inner * 0.17;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${colors.paper}"/>
      <stop offset="70%" stop-color="${colors.warmPaper}"/>
      <stop offset="100%" stop-color="#F1EEE8"/>
    </radialGradient>
    <linearGradient id="gold" x1="18%" y1="12%" x2="82%" y2="88%">
      <stop offset="0%" stop-color="${colors.goldSoft}"/>
      <stop offset="52%" stop-color="${colors.gold}"/>
      <stop offset="100%" stop-color="#9A7434"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${size * 0.018}" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.95 0 1 0 0 0.73 0 0 1 0 0.32 0 0 0 0.55 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="url(#gold)" stroke-width="${size * 0.021}" opacity="0.96"/>
  <circle cx="${c}" cy="${c}" r="${smallR}" fill="none" stroke="${colors.line}" stroke-width="${size * 0.009}" opacity="0.95" stroke-dasharray="${size * 0.022} ${size * 0.032}"/>
  <path d="M ${c} ${c - star}
           C ${c + star * 0.18} ${c - star * 0.34}, ${c + star * 0.34} ${c - star * 0.18}, ${c + star} ${c}
           C ${c + star * 0.34} ${c + star * 0.18}, ${c + star * 0.18} ${c + star * 0.34}, ${c} ${c + star}
           C ${c - star * 0.18} ${c + star * 0.34}, ${c - star * 0.34} ${c + star * 0.18}, ${c - star} ${c}
           C ${c - star * 0.34} ${c - star * 0.18}, ${c - star * 0.18} ${c - star * 0.34}, ${c} ${c - star} Z"
        fill="url(#gold)" filter="url(#glow)"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.026}" fill="${colors.paper}" opacity="0.98"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.011}" fill="${colors.gold}"/>
  <g fill="${colors.goldSoft}" opacity="0.74">
    <circle cx="${c}" cy="${c - r}" r="${size * 0.012}"/>
    <circle cx="${c + r}" cy="${c}" r="${size * 0.01}"/>
    <circle cx="${c}" cy="${c + r}" r="${size * 0.012}"/>
    <circle cx="${c - r}" cy="${c}" r="${size * 0.01}"/>
  </g>
</svg>`;
};

const featureSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="bg" cx="76%" cy="44%" r="82%">
      <stop offset="0%" stop-color="${colors.paper}"/>
      <stop offset="62%" stop-color="${colors.warmPaper}"/>
      <stop offset="100%" stop-color="#F1EEE8"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldSoft}"/>
      <stop offset="56%" stop-color="${colors.gold}"/>
      <stop offset="100%" stop-color="#8F6B30"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <circle cx="802" cy="250" r="168" fill="none" stroke="url(#gold)" stroke-width="10" opacity="0.95"/>
  <circle cx="802" cy="250" r="112" fill="none" stroke="${colors.line}" stroke-width="4" opacity="0.95" stroke-dasharray="13 16"/>
  <path d="M802 140 C820 215 837 232 912 250 C837 268 820 285 802 360 C784 285 767 268 692 250 C767 232 784 215 802 140Z" fill="url(#gold)"/>
  <circle cx="802" cy="250" r="17" fill="${colors.paper}" opacity="0.98"/>
  <circle cx="802" cy="250" r="7" fill="${colors.gold}"/>
  <text x="76" y="166" fill="${colors.bone}" font-family="Pretendard, Noto Sans KR, Arial, sans-serif" font-size="58" font-weight="800" letter-spacing="0">인생의 회전목마</text>
  <text x="78" y="224" fill="${colors.mist}" font-family="Pretendard, Noto Sans KR, Arial, sans-serif" font-size="25" font-weight="500">사주 · 타로 · 운세를 조용하고 선명하게</text>
  <line x1="78" y1="278" x2="300" y2="278" stroke="url(#gold)" stroke-width="2"/>
  <text x="78" y="330" fill="${colors.gold}" font-family="Pretendard, Noto Sans KR, Arial, sans-serif" font-size="26" font-weight="650">오늘의 흐름을 읽고, 나의 리듬을 정리해요</text>
</svg>`;

const splashSvg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${colors.paper}"/>
  <g transform="translate(${size / 2} ${size / 2})">
    <circle r="${size * 0.27}" fill="none" stroke="${colors.gold}" stroke-width="${size * 0.018}"/>
    <circle r="${size * 0.18}" fill="none" stroke="${colors.goldSoft}" stroke-width="${size * 0.004}" opacity="0.42" stroke-dasharray="${size * 0.018} ${size * 0.026}"/>
    <path d="M0 ${-size * 0.145} C${size * 0.026} ${-size * 0.042} ${size * 0.042} ${-size * 0.026} ${size * 0.145} 0 C${size * 0.042} ${size * 0.026} ${size * 0.026} ${size * 0.042} 0 ${size * 0.145} C${-size * 0.026} ${size * 0.042} ${-size * 0.042} ${size * 0.026} ${-size * 0.145} 0 C${-size * 0.042} ${-size * 0.026} ${-size * 0.026} ${-size * 0.042} 0 ${-size * 0.145}Z" fill="${colors.gold}"/>
  </g>
</svg>`;

async function writePng(file, svg, width, height = width) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(file);
}

async function main() {
  await fs.writeFile(path.join(root, "public/icon.svg"), iconSvg(512, false), "utf8");
  await writePng(path.join(root, "public/icons-pwa/icon-192.png"), iconSvg(512, false), 192);
  await writePng(path.join(root, "public/icons-pwa/icon-512.png"), iconSvg(512, false), 512);
  await writePng(path.join(root, "public/icons-pwa/icon-192-maskable.png"), iconSvg(512, true), 192);
  await writePng(path.join(root, "public/icons-pwa/icon-512-maskable.png"), iconSvg(512, true), 512);
  await writePng(path.join(root, "public/icons-pwa/splash-1080x1920.png"), splashSvg(1080), 1080, 1920);

  await writePng(path.join(root, "android/store_icon.png"), iconSvg(512, false), 512);
  await writePng(path.join(root, "android/feature-graphic-1024x500.png"), featureSvg, 1024, 500);

  const mipmapSizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [density, size] of Object.entries(mipmapSizes)) {
    await writePng(path.join(root, `android/app/src/main/res/mipmap-${density}/ic_launcher.png`), iconSvg(512, false), size);
    await writePng(path.join(root, `android/app/src/main/res/mipmap-${density}/ic_maskable.png`), iconSvg(512, true), size);
  }

  const splashSizes = { mdpi: 300, hdpi: 450, xhdpi: 600, xxhdpi: 900, xxxhdpi: 1200 };
  for (const [density, size] of Object.entries(splashSizes)) {
    await writePng(path.join(root, `android/app/src/main/res/drawable-${density}/splash.png`), splashSvg(size), size);
  }
}

await main();
