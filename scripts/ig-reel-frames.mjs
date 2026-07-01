/**
 * 인스타 릴스용 프레임 생성 (1080×1920, 9:16).
 * 훅 → 9멤버(얼굴+이름+번호) → CTA. ffmpeg 가 이 프레임들을 영상으로 합친다.
 * 음악은 IG 릴스 편집기에서 '트렌딩 오디오'를 입히는 게 도달에 유리 → 영상은 무음.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const ROOT = "C:/Users/User/projects/carousel-of-life/public";
const OUT = "C:/Users/User/projects/carousel-of-life/scripts/.reel-frames";
mkdirSync(OUT, { recursive: true });

const W = 1080;
const H = 1920;
const IMG_H = 1300; // 멤버 사진 영역(상단)
const BG = "#161019";
const GOLD = "#c9a96a";
const CREAM = "#f3e9d2";

const MEMBERS = [
  { img: "/characters/idols/performance/ian.webp", name: "이안", role: "차분한 리더" },
  { img: "/characters/idols/snaps/yujun-01-acoustic.webp", name: "유준", role: "따뜻한 보컬" },
  { img: "/characters/idols/snaps/doyoon-03-red-stage.webp", name: "도윤", role: "선명한 퍼포머" },
  { img: "/characters/idols/snaps/jaeha-01-studio.webp", name: "재하", role: "조용한 프로듀서" },
  { img: "/characters/idols/snaps/haru-01-denim.webp", name: "하루", role: "밝은 무드메이커" },
  { img: "/characters/idols/snaps/sion-05-street.webp", name: "시온", role: "시크한 래퍼" },
  { img: "/characters/idols/snaps/theo-05-blue.webp", name: "태오", role: "에너지 메인댄서" },
  { img: "/characters/idols/snaps/evan-05-portrait.webp", name: "이현", role: "차분한 애널리스트" },
  { img: "/characters/idols/snaps/luhan-05-cardigan.webp", name: "하민", role: "스무 살 막내" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** 가운데 정렬 텍스트 카드(훅/CTA용). lines: [{t,size,fill,dy}] */
async function textCard(file, lines) {
  const tspans = lines
    .map(
      (l) =>
        `<text x="${W / 2}" y="${l.y}" font-family="Malgun Gothic, sans-serif" font-size="${l.size}" font-weight="${l.bold ? "bold" : "normal"}" fill="${l.fill}" text-anchor="middle">${esc(l.t)}</text>`,
    )
    .join("");
  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${BG}"/>${tspans}</svg>`,
  );
  await sharp(svg).jpeg({ quality: 92 }).toFile(`${OUT}/${file}`);
}

/** 멤버 프레임: 상단 사진 + 하단 이름/번호 밴드. */
async function memberFrame(file, m, n) {
  const photo = await sharp(ROOT + m.img)
    .resize(W, IMG_H, { fit: "cover", position: "top" })
    .toBuffer();
  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(22,16,25,0)"/>
        <stop offset="1" stop-color="${BG}"/>
      </linearGradient></defs>
      <rect x="0" y="${IMG_H - 180}" width="${W}" height="180" fill="url(#g)"/>
      <rect x="0" y="${IMG_H}" width="${W}" height="${H - IMG_H}" fill="${BG}"/>
      <circle cx="120" cy="${IMG_H + 150}" r="66" fill="none" stroke="${GOLD}" stroke-width="5"/>
      <text x="120" y="${IMG_H + 178}" font-family="Arial, sans-serif" font-size="84" font-weight="bold" fill="${CREAM}" text-anchor="middle">${n}</text>
      <text x="230" y="${IMG_H + 130}" font-family="Malgun Gothic, sans-serif" font-size="92" font-weight="bold" fill="${CREAM}">${esc(m.name)}</text>
      <text x="232" y="${IMG_H + 205}" font-family="Malgun Gothic, sans-serif" font-size="46" fill="${GOLD}">${esc(m.role)}</text>
      <text x="${W / 2}" y="${H - 60}" font-family="Malgun Gothic, sans-serif" font-size="40" fill="rgba(243,233,210,0.55)" text-anchor="middle">🎠 캐러셀나인</text>
    </svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([{ input: photo, top: 0, left: 0 }, { input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toFile(`${OUT}/${file}`);
}

// 0) 훅
await textCard("f00.jpg", [
  { t: "버추얼 아이돌 9명 중", y: 820, size: 70, fill: GOLD },
  { t: "네 최애는?", y: 960, size: 130, fill: CREAM, bold: true },
  { t: "🎠", y: 1130, size: 110, fill: CREAM },
]);

// 1~9) 멤버
for (let i = 0; i < MEMBERS.length; i += 1) {
  await memberFrame(`f${String(i + 1).padStart(2, "0")}.jpg`, MEMBERS[i], i + 1);
}

// 10) CTA
await textCard("f10.jpg", [
  { t: "최애가 내 진짜 사주로", y: 760, size: 72, fill: CREAM, bold: true },
  { t: "오늘 운세까지 봐줘요", y: 870, size: 72, fill: CREAM, bold: true },
  { t: "캐러셀나인", y: 1080, size: 96, fill: GOLD, bold: true },
  { t: "프로필 링크에서 무료로 시작 →", y: 1180, size: 50, fill: CREAM },
]);

console.log("FRAMES DONE:", OUT);
