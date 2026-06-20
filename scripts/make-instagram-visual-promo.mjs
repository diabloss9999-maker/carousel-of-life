import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const outDir = path.join(root, "promo");
const frameDir = path.join(outDir, "frames-instagram-visual-promo");
const outputSilent = path.join(outDir, "instagram-carousel-nine-visual-reel.mp4");
const outputAudio = path.join(outDir, "instagram-carousel-nine-visual-reel-with-album-audio.mp4");
const albumAudio = "C:/Users/User/Downloads/Carousel_Nine_인생의_회전목마_YouTube.mp4";

const W = 1080;
const H = 1920;
const FPS = 24;
const DURATION = 15;
const TOTAL = FPS * DURATION;

const scenes = [
  {
    image: "public/characters/idols/group-editorial/group-editorial-03-black-stage.png",
    position: "center",
    title: "Carousel Nine",
    sub: "운세에서 대화까지",
  },
  {
    image: "public/characters/idols/editorial/sion-editorial.webp",
    position: "north",
    title: "오늘의 기분을",
    sub: "멤버가 먼저 읽어줘",
  },
  {
    image: "public/characters/idols/editorial/theo-editorial.webp",
    position: "north",
    title: "운세만 보고",
    sub: "끝내기 아쉬울 때",
  },
  {
    image: "public/characters/idols/snaps/doyoon-03-red-stage.webp",
    position: "north",
    title: "타로 · 사주 · 궁합",
    sub: "바로 이어지는 멤버 대화",
  },
  {
    image: "public/characters/idols/editorial/hamin-editorial.webp",
    position: "north",
    title: "마음 가는 멤버와",
    sub: "조용히 이야기해봐",
  },
  {
    image: "public/characters/idols/group-editorial/group-editorial-10-racing-editorial.png",
    position: "center",
    title: "9명의 멤버",
    sub: "오늘 너에게 맞는 목소리",
  },
  {
    image: "public/characters/idols/snaps/luhan-01-blue.webp",
    position: "north",
    title: "인생의 회전목마",
    sub: "carouseloflife.com",
    cta: true,
  },
];

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function ease(x) {
  x = clamp(x, 0, 1);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function localProgress(frame, start, end) {
  return clamp((frame - start) / (end - start), 0, 1);
}

function textOverlay(scene, p) {
  const fade = Math.min(1, p * 4, (1 - p) * 4);
  const y = Math.round((1 - ease(Math.min(1, p * 2))) * 34);
  const titleY = scene.cta ? 1320 : 1420;
  const cta = scene.cta
    ? `<g filter="url(#shadow)">
        <rect x="72" y="1534" width="936" height="178" rx="48" fill="rgba(13,11,10,.86)" />
        <text x="540" y="1608" text-anchor="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="42" font-weight="900" fill="#fff4dd">지금 멤버와 대화하기</text>
        <text x="540" y="1662" text-anchor="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="700" fill="rgba(255,244,221,.72)">인생의 회전목마</text>
      </g>`
    : "";

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(0,0,0,.36)" />
    <stop offset=".34" stop-color="rgba(0,0,0,0)" />
  </linearGradient>
  <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(0,0,0,0)" />
    <stop offset=".55" stop-color="rgba(0,0,0,.18)" />
    <stop offset="1" stop-color="rgba(0,0,0,.68)" />
  </linearGradient>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".40"/>
  </filter>
</defs>
<rect width="1080" height="640" fill="url(#top)" />
<rect y="900" width="1080" height="1020" fill="url(#bottom)" />
<text x="72" y="104" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="900" fill="rgba(255,255,255,.82)">인생의 회전목마</text>
<g opacity="${fade}" transform="translate(0 ${y})" filter="url(#shadow)">
  <text x="72" y="${titleY}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${scene.cta ? 70 : 76}" font-weight="900" fill="#fff" letter-spacing="0">${esc(scene.title)}</text>
  <text x="72" y="${titleY + 70}" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="36" font-weight="800" fill="rgba(255,255,255,.84)" letter-spacing="0">${esc(scene.sub)}</text>
</g>
${cta}
</svg>`);
}

async function fullBleed(file, frameP, sceneIndex, position) {
  const input = path.join(root, file);
  const meta = await sharp(input).metadata();
  const zoom = 1.06 + 0.07 * ease(frameP);
  const targetW = Math.round(W * zoom);
  const targetH = Math.round(H * zoom);
  const sourceAspect = (meta.width ?? 1) / (meta.height ?? 1);
  const targetAspect = targetW / targetH;

  let resizedW;
  let resizedH;
  if (sourceAspect > targetAspect) {
    resizedH = targetH;
    resizedW = Math.round(resizedH * sourceAspect);
  } else {
    resizedW = targetW;
    resizedH = Math.round(resizedW / sourceAspect);
  }

  const maxX = Math.max(0, resizedW - W);
  const maxY = Math.max(0, resizedH - H);
  const direction = sceneIndex % 2 === 0 ? 1 : -1;
  const pan = (ease(frameP) - 0.5) * direction;
  const left = Math.round(clamp(maxX / 2 + pan * maxX * 0.42, 0, maxX));
  const topBias = position === "north" ? 0.16 : 0.5;
  const top = Math.round(clamp(maxY * topBias + pan * maxY * 0.08, 0, maxY));

  return sharp(input)
    .resize(resizedW, resizedH, { fit: "fill" })
    .extract({ left, top, width: W, height: H })
    .modulate({ brightness: 1.02, saturation: 1.12 })
    .sharpen({ sigma: 0.45, m1: 1.08, m2: 0.5 })
    .jpeg({ quality: 97, mozjpeg: true })
    .toBuffer();
}

async function render() {
  await fs.rm(frameDir, { recursive: true, force: true });
  await fs.mkdir(frameDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });

  const sceneFrames = Math.floor(TOTAL / scenes.length);

  for (let frame = 0; frame < TOTAL; frame++) {
    const sceneIndex = Math.min(scenes.length - 1, Math.floor(frame / sceneFrames));
    const start = sceneIndex * sceneFrames;
    const end = sceneIndex === scenes.length - 1 ? TOTAL : start + sceneFrames;
    const p = localProgress(frame, start, end);
    const scene = scenes[sceneIndex];
    const base = await fullBleed(scene.image, p, sceneIndex, scene.position);
    const overlay = textOverlay(scene, p);

    await sharp(base)
      .composite([{ input: overlay, left: 0, top: 0 }])
      .jpeg({ quality: 96, mozjpeg: true })
      .toFile(path.join(frameDir, `frame-${String(frame).padStart(4, "0")}.jpg`));
  }

  const silent = spawnSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(frameDir, "frame-%04d.jpg"),
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest",
    "-c:v", "libx264",
    "-crf", "17",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-r", String(FPS),
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputSilent,
  ], { stdio: "inherit" });
  if (silent.status !== 0) throw new Error("silent video encode failed");

  const withAudio = spawnSync("ffmpeg", [
    "-y",
    "-i", outputSilent,
    "-ss", "0",
    "-t", String(DURATION),
    "-i", albumAudio,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-af", "afade=t=in:st=0:d=0.8,afade=t=out:st=13.8:d=1.2,volume=0.94",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    outputAudio,
  ], { stdio: "inherit" });
  if (withAudio.status !== 0) throw new Error("audio mux failed");

  await fs.rm(frameDir, { recursive: true, force: true });
  console.log(outputAudio);
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
