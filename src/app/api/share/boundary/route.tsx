/**
 * 오늘의 경계 카드 — 하루 결산 공유 이미지.
 *
 * GET /api/share/boundary?mood=tough&char=흑랑&crack=2
 *     &pattern=달카드3번&date=2026.05.12
 *
 * "이거 본 사람 있음?" 을 유도하는 공유 카드.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const MOOD_SYMBOL: Record<string, string> = {
  great: "✦", good: "○", neutral: "—", tough: "△", hard: "▼",
};
const MOOD_LABEL_KO: Record<string, string> = {
  great: "최고야", good: "좋아", neutral: "그냥 그래",
  tough: "힘드네", hard: "많이 힘들어",
};
const MOOD_LABEL_EN: Record<string, string> = {
  great: "Great", good: "Good", neutral: "Just so-so",
  tough: "Tough", hard: "Really hard",
};

const CRACK_STATE_KO: Record<string, { label: string; color: string; bg: string }> = {
  "0": { label: "경계 · 안정",      color: "#504058", bg: "#1a1025" },
  "1": { label: "경계 · 파동 감지", color: "#7060a0", bg: "#1a1030" },
  "2": { label: "경계 · 균열 확장", color: "#906080", bg: "#200a18" },
  "3": { label: "경계 · 위험",      color: "#c04060", bg: "#280010" },
  "4": { label: "경계 · 임박",      color: "#e02040", bg: "#300008" },
};
const CRACK_STATE_EN: Record<string, { label: string; color: string; bg: string }> = {
  "0": { label: "Boundary · Stable",   color: "#504058", bg: "#1a1025" },
  "1": { label: "Boundary · Ripple",   color: "#7060a0", bg: "#1a1030" },
  "2": { label: "Boundary · Fracture", color: "#906080", bg: "#200a18" },
  "3": { label: "Boundary · Danger",   color: "#c04060", bg: "#280010" },
  "4": { label: "Boundary · Imminent", color: "#e02040", bg: "#300008" },
};

const I18N_KO_B = {
  appName: "인생의 회전목마",
  today: "오늘",
  readBy: (name: string) => `${name}이 읽어줬어`,
  defaultChar: "주술사",
};
const I18N_EN_B = {
  appName: "Carousel of Life",
  today: "Today",
  readBy: (name: string) => `Read by ${name}`,
  defaultChar: "Shaman",
};

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const locale = sp.get("locale") === "en" ? "en" : "ko";
  const T = locale === "en" ? I18N_EN_B : I18N_KO_B;
  const MOOD_LABEL = locale === "en" ? MOOD_LABEL_EN : MOOD_LABEL_KO;
  const CRACK_STATE = locale === "en" ? CRACK_STATE_EN : CRACK_STATE_KO;

  const mood    = sp.get("mood")    ?? "neutral";
  const char    = sp.get("char")    || T.defaultChar;
  const crack   = sp.get("crack")   ?? "0";
  const pattern = sp.get("pattern") ?? null;
  const date    = sp.get("date")    ?? "";

  const moodSym   = MOOD_SYMBOL[mood]  ?? "—";
  const moodLbl   = MOOD_LABEL[mood]   ?? mood;
  const crackInfo = CRACK_STATE[crack] ?? CRACK_STATE["0"];
  const crackInt  = parseInt(crack, 10);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080, height: 1080,
          display: "flex", flexDirection: "column",
          background: `linear-gradient(160deg, ${crackInfo.bg} 0%, #0d0818 60%, #080510 100%)`,
          fontFamily: '"Noto Serif KR", "Malgun Gothic", serif',
          color: "#f0e8d8",
          padding: "72px 80px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* 배경 원 */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700, height: 700, borderRadius: "50%",
          border: `1px solid ${crackInfo.color}20`,
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 500, borderRadius: "50%",
          border: `1px solid ${crackInfo.color}15`,
        }} />

        {/* 상단 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 60 }}>
          <span style={{ fontSize: 20, color: "#60506a", letterSpacing: 3 }}>
            {T.appName}
          </span>
          <span style={{ fontSize: 16, color: "#40304a", letterSpacing: 2 }}>
            {date}
          </span>
        </div>

        {/* 중앙: 메인 컨텐츠 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          {/* 감정 심볼 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 120, color: "#f0e8d8", lineHeight: 1 }}>
              {moodSym}
            </span>
            <span style={{ fontSize: 32, color: "#c8b8a8", letterSpacing: 2 }}>
              {moodLbl}
            </span>
          </div>

          {/* 구분선 */}
          <div style={{ width: 200, height: 1, background: "#ffffff10" }} />

          {/* 캐릭터 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, color: "#50405a", letterSpacing: 3 }}>
              {T.today}
            </span>
            <span style={{ fontSize: 28, color: "#9070a0", fontWeight: 700 }}>
              {T.readBy(char)}
            </span>
          </div>

          {/* 패턴 감지 */}
          {pattern && (
            <div style={{
              border: `1px solid ${crackInfo.color}30`,
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 18,
              color: crackInfo.color,
              letterSpacing: 1,
            }}>
              {pattern}
            </div>
          )}
        </div>

        {/* 하단: 균열 상태 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: crackInfo.color, letterSpacing: 3 }}>
              {crackInfo.label}
            </span>
            <span style={{ fontSize: 13, color: "#30203a", letterSpacing: 2 }}>
              BOUNDARY INDEX
            </span>
          </div>
          {/* 균열 바 */}
          <div style={{
            width: "100%", height: 2, borderRadius: 1,
            background: "#ffffff08", display: "flex",
          }}>
            <div style={{
              width: `${Math.min(100, crackInt * 25)}%`,
              height: "100%", borderRadius: 1,
              background: `linear-gradient(to right, ${crackInfo.color}60, ${crackInfo.color})`,
            }} />
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
