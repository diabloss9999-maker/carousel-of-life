import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const outDir = path.join(root, "promo");
const frameDir = path.join(outDir, "frames-instagram-promo");
const output = path.join(outDir, "instagram-carousel-nine-reel.mp4");

const W = 1080;
const H = 1920;
const FPS = 24;
const DURATION = 15;
const TOTAL = FPS * DURATION;

const assets = {
  bg: path.join(root, "public/backgrounds/carousel-meadow.webp"),
  group: path.join(root, "public/characters/idols/group-chat.png"),
  fortune: path.join(root, "public/characters/idols/fortune/ian-fortune-reader-premium.png"),
  tarot: path.join(root, "public/characters/idols/tarot-readers/hamin-tarot-reader-premium.png"),
  yujun: path.join(root, "public/characters/idols/editorial/yujun-editorial.webp"),
  sion: path.join(root, "public/characters/idols/editorial/sion-editorial.webp"),
  jaeha: path.join(root, "public/characters/idols/editorial/jaeha-editorial.webp"),
  haru: path.join(root, "public/characters/idols/editorial/haru-editorial.webp"),
  theo: path.join(root, "public/characters/idols/editorial/theo-editorial.webp"),
};

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

function easeInOut(x) {
  x = Math.max(0, Math.min(1, x));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function sceneProgress(t, start, end) {
  return Math.max(0, Math.min(1, (t - start) / (end - start)));
}

function textLines(lines, { x, y, size = 64, weight = 800, color = "#17110b", gap = 1.18, anchor = "start" }) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" letter-spacing="0">
${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * gap}">${esc(line)}</tspan>`).join("")}
</text>`;
}

function pill({ x, y, w, h, text, size = 34, fill = "rgba(255,255,255,.72)", color = "#24190d" }) {
  return `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="rgba(255,255,255,.45)" />
<text x="${x + w / 2}" y="${y + h / 2 + size * 0.34}" text-anchor="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${size}" font-weight="800" fill="${color}">${esc(text)}</text>
</g>`;
}

function bubble({ x, y, w, h, text, sub = "", align = "left", fill = "rgba(255,255,255,.82)" }) {
  const tx = align === "right" ? x + w - 38 : x + 38;
  const anchor = align === "right" ? "end" : "start";
  return `<g filter="url(#shadow)">
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${fill}" stroke="rgba(255,255,255,.55)" />
<text x="${tx}" y="${y + 58}" text-anchor="${anchor}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="34" font-weight="800" fill="#1c140c">${esc(text)}</text>
${sub ? `<text x="${tx}" y="${y + 106}" text-anchor="${anchor}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="28" font-weight="600" fill="rgba(28,20,12,.70)">${esc(sub)}</text>` : ""}
</g>`;
}

function overlaySvg(t, scene, p) {
  const fade = Math.min(1, p * 3, (1 - p) * 3);
  const yIn = (1 - easeOutCubic(Math.min(1, p * 2))) * 42;
  const brand = `<text x="78" y="102" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="900" fill="rgba(30,20,10,.72)">인생의 회전목마</text>`;
  const common = `<defs>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#2a1805" flood-opacity=".18"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#v)" />
<defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop stop-color="rgba(255,255,255,.22)" offset="0"/><stop stop-color="rgba(255,245,220,.04)" offset=".48"/><stop stop-color="rgba(25,16,8,.18)" offset="1"/></linearGradient></defs>
${brand}`;

  if (scene === 0) {
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${common}
<g opacity="${fade}" transform="translate(0 ${yIn})">
${pill({ x: 78, y: 198, w: 314, h: 64, text: "오늘 운세 + 멤버 대화", size: 26 })}
${textLines(["오늘 운세,", "누가 읽어주면", "더 설레지?"], { x: 78, y: 380, size: 82, color: "#17100a" })}
<text x="78" y="680" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="36" font-weight="700" fill="rgba(23,16,10,.72)">Carousel Nine 멤버와 이어지는 운세 앱</text>
</g>
</svg>`;
  }

  if (scene === 1) {
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${common}
<g opacity="${fade}" transform="translate(0 ${yIn})">
${textLines(["운세만 보고", "끝내기 아쉬울 때"], { x: 78, y: 220, size: 74 })}
${bubble({ x: 92, y: 1290, w: 780, h: 146, text: "오늘 흐름, 좀 더 물어볼래?", sub: "멤버가 바로 이어서 읽어줘요" })}
</g>
</svg>`;
  }

  if (scene === 2) {
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${common}
<g opacity="${fade}" transform="translate(0 ${yIn})">
${pill({ x: 78, y: 182, w: 210, h: 58, text: "타로 · 사주", size: 27 })}
${textLines(["결과를 보고", "바로 대화로"], { x: 78, y: 340, size: 80 })}
${bubble({ x: 118, y: 1015, w: 720, h: 132, text: "이 카드가 왜 나왔을까?", sub: "", fill: "rgba(255,238,178,.88)" })}
${bubble({ x: 244, y: 1182, w: 720, h: 150, text: "지금 마음이 흔들리는 쪽을", sub: "조금 더 봐주고 있어.", fill: "rgba(255,255,255,.86)" })}
</g>
</svg>`;
  }

  if (scene === 3) {
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${common}
<g opacity="${fade}" transform="translate(0 ${yIn})">
${textLines(["9명의 멤버,", "오늘의 너에게", "맞는 목소리"], { x: 78, y: 218, size: 74 })}
${pill({ x: 78, y: 1514, w: 206, h: 62, text: "운세", size: 28 })}
${pill({ x: 308, y: 1514, w: 206, h: 62, text: "타로", size: 28 })}
${pill({ x: 538, y: 1514, w: 206, h: 62, text: "대화", size: 28 })}
${pill({ x: 768, y: 1514, w: 206, h: 62, text: "궁합", size: 28 })}
</g>
</svg>`;
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${common}
<g opacity="${fade}" transform="translate(0 ${yIn})">
${textLines(["지금,", "마음 가는 멤버와", "이야기해봐"], { x: 78, y: 280, size: 78 })}
<text x="78" y="610" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="38" font-weight="700" fill="rgba(23,16,10,.72)">운세에서 대화까지, 인생의 회전목마</text>
<rect x="78" y="1510" width="924" height="172" rx="44" fill="rgba(21,15,9,.86)" filter="url(#shadow)" />
<text x="540" y="1585" text-anchor="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="42" font-weight="900" fill="#fff5dd">인생의 회전목마</text>
<text x="540" y="1640" text-anchor="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="700" fill="rgba(255,245,221,.76)">carouseloflife.com</text>
</g>
</svg>`;
}

async function roundedImage(file, width, height, radius = 46) {
  const img = await sharp(file)
    .resize(width, height, { fit: "cover", position: "center" })
    .modulate({ brightness: 1.02, saturation: 1.16 })
    .sharpen({ sigma: 0.55, m1: 1.05, m2: 0.5 })
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`);
  return sharp(img).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function sharpPortrait(file, width, height, position = "north", radius = 56) {
  const img = await sharp(file)
    .resize(width, height, { fit: "cover", position })
    .modulate({ brightness: 1.03, saturation: 1.22 })
    .sharpen({ sigma: 0.55, m1: 1.12, m2: 0.54 })
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`);
  return sharp(img).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function main() {
  await fs.rm(frameDir, { recursive: true, force: true });
  await fs.mkdir(frameDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });

  const baseBg = await sharp(assets.bg)
    .resize(W, H, { fit: "cover", position: "center" })
    .modulate({ brightness: 1.03, saturation: 1.08 })
    .blur(1.2)
    .jpeg({ quality: 94 })
    .toBuffer();

  const group = await roundedImage(assets.group, 1080, 608, 54);
  const fortune = await sharpPortrait(assets.fortune, 980, 760, "north", 54);
  const tarot = await sharpPortrait(assets.tarot, 760, 1140, "north", 58);
  const yujun = await sharpPortrait(assets.yujun, 620, 930, "north", 52);
  const sion = await sharpPortrait(assets.sion, 620, 930, "north", 52);
  const jaeha = await sharpPortrait(assets.jaeha, 620, 930, "north", 52);
  const haru = await sharpPortrait(assets.haru, 620, 930, "north", 52);
  const theo = await sharpPortrait(assets.theo, 620, 930, "north", 52);

  for (let i = 0; i < TOTAL; i++) {
    const t = i / FPS;
    const scene = Math.min(4, Math.floor(t / 3));
    const p = sceneProgress(t, scene * 3, scene * 3 + 3);
    const bob = Math.sin(t * Math.PI * 2 * 0.22) * 10;
    const composites = [];

    if (scene === 0) {
      const y = Math.round(690 - easeOutCubic(p) * 58 + bob);
      composites.push({ input: yujun, left: 420, top: y });
      composites.push({ input: jaeha, left: 42, top: y + 80 });
    } else if (scene === 1) {
      const scaleY = Math.round(690 - easeInOut(p) * 60 + bob);
      composites.push({ input: fortune, left: 50, top: scaleY });
    } else if (scene === 2) {
      const x = Math.round(270 + Math.sin(t * 0.8) * 16);
      composites.push({ input: tarot, left: x, top: 310 });
    } else if (scene === 3) {
      composites.push({ input: haru, left: 0, top: 620 + Math.round(bob) });
      composites.push({ input: sion, left: 460, top: 620 - Math.round(bob) });
    } else {
      const y = Math.round(720 - easeOutCubic(p) * 70 + bob);
      composites.push({ input: group, left: 0, top: y });
      composites.push({ input: theo, left: 470, top: 610 - Math.round(bob) });
    }

    composites.push({ input: Buffer.from(overlaySvg(t, scene, p)), left: 0, top: 0 });

    await sharp(baseBg)
      .composite(composites)
      .sharpen({ sigma: 0.35 })
      .jpeg({ quality: 96, mozjpeg: true })
      .toFile(path.join(frameDir, `frame-${String(i).padStart(4, "0")}.jpg`));
  }

  const ffmpeg = spawnSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(frameDir, "frame-%04d.jpg"),
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest",
    "-c:v", "libx264",
    "-crf", "18",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-r", String(FPS),
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    output,
  ], { stdio: "inherit" });

  if (ffmpeg.status !== 0) {
    throw new Error(`ffmpeg failed with code ${ffmpeg.status}`);
  }

  await fs.rm(frameDir, { recursive: true, force: true });
  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
