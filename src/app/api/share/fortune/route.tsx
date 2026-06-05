/**
 * 운세 결과 공유 이미지 — 세계관 강화 버전.
 *
 * GET /api/share/fortune?title=...&score=85&category=...
 *     &content=...&color=보라&number=7&direction=동쪽
 *     &date=2026.05.11&char=루나&charTitle=달의마녀&crack=1
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const CRACK_LABEL_KO: Record<string, string> = {
  "0": "결 · 안정",
  "1": "결 · 파동 감지",
  "2": "결 · 흐림 확장",
  "3": "결 · 주의",
  "4": "결 · 가까움",
};
const CRACK_LABEL_EN: Record<string, string> = {
  "0": "Boundary · Stable",
  "1": "Boundary · Ripple",
  "2": "Boundary · Fracture",
  "3": "Boundary · Danger",
  "4": "Boundary · Imminent",
};

const I18N_KO = {
  appName: "인생의 회전목마",
  scoreUnit: "점",
  defaultTitle: "오늘의 흐름",
  defaultCategory: "운세",
  defaultChar: "점술사",
  luckyColor: "행운의 색",
  luckyNumber: "행운의 숫자",
  luckyDirection: "행운의 방향",
};
const I18N_EN = {
  appName: "Carousel of Life",
  scoreUnit: "pts",
  defaultTitle: "Today's flow",
  defaultCategory: "Fortune",
  defaultChar: "Shaman",
  luckyColor: "Lucky color",
  luckyNumber: "Lucky number",
  luckyDirection: "Lucky direction",
};

const CRACK_COLOR: Record<string, string> = {
  "0": "#3a3050",
  "1": "#4a3060",
  "2": "#5a2050",
  "3": "#6a1040",
  "4": "#7a0030",
};

function scoreAccent(score: number): string {
  if (score >= 80) return "#c8a96e";
  if (score >= 60) return "#7c9fd4";
  return "#a07070";
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const locale = sp.get("locale") === "en" ? "en" : "ko";
  const T = locale === "en" ? I18N_EN : I18N_KO;
  const CRACK_LABEL = locale === "en" ? CRACK_LABEL_EN : CRACK_LABEL_KO;

  const title     = sp.get("title")     ?? T.defaultTitle;
  const score     = Math.min(100, Math.max(0, Number(sp.get("score") ?? 70)));
  const category  = sp.get("category")  ?? T.defaultCategory;
  const content   = truncate(sp.get("content") ?? "", 60);
  const color     = sp.get("color")     ?? null;
  const number    = sp.get("number")    ?? null;
  const direction = sp.get("direction") ?? null;
  const date      = sp.get("date")      ?? "";
  const charName  = sp.get("char")      ?? T.defaultChar;
  const charTitle = sp.get("charTitle") ?? "";
  const crack     = sp.get("crack")     ?? "0";

  const accent      = scoreAccent(score);
  const crackLabel  = CRACK_LABEL[crack] ?? CRACK_LABEL["0"];
  const crackColor  = CRACK_COLOR[crack] ?? CRACK_COLOR["0"];
  const crackInt    = parseInt(crack, 10);

  // 흐림 바 길이 (0~4 → 0~100%)
  const crackBarPct = Math.min(100, crackInt * 25);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080, height: 1080,
          display: "flex", flexDirection: "column",
          background: `linear-gradient(160deg, #0d0818 0%, ${crackColor}30 50%, #0a0512 100%)`,
          fontFamily: '"Noto Serif KR", "Malgun Gothic", serif',
          color: "#f0e8d8",
          padding: "64px 72px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* 배경 글로우 */}
        <div style={{
          position: "absolute", top: -200, right: -200,
          width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
        }} />

        {/* 상단: 앱명 + 세계 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 20, color: "#a090b0", letterSpacing: 3 }}>
              {T.appName}
            </span>
            <span style={{ fontSize: 14, color: "#604060", letterSpacing: 2 }}>
              CAROUSEL OF LIFE
            </span>
          </div>
          {/* 캐릭터 배지 */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
          }}>
            <span style={{
              fontSize: 18, color: accent, fontWeight: 700,
              border: `1px solid ${accent}50`,
              borderRadius: 100, padding: "4px 16px",
            }}>
              {charName}
            </span>
            {charTitle && (
              <span style={{ fontSize: 13, color: "#70607a" }}>{charTitle}</span>
            )}
          </div>
        </div>

        {/* 카테고리 */}
        <span style={{
          fontSize: 16, color: "#80708a", letterSpacing: 3, marginBottom: 16,
        }}>
          {category}
        </span>

        {/* 점수 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 110, fontWeight: 700, color: accent, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 32, color: `${accent}aa`, marginBottom: 16 }}>{T.scoreUnit}</span>
        </div>

        {/* 구분선 */}
        <div style={{
          height: 1,
          background: `linear-gradient(to right, ${accent}80, transparent)`,
          marginBottom: 28,
        }} />

        {/* 제목 */}
        <p style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.3, marginBottom: 20, color: "#f5ecd8" }}>
          {title}
        </p>

        {/* 내용 */}
        {content && (
          <p style={{ fontSize: 26, lineHeight: 1.65, color: "#c8b8a8", marginBottom: 32, flexGrow: 1 }}>
            {content}
          </p>
        )}

        {/* 행운 정보 */}
        {(color || number || direction) && (
          <div style={{ display: "flex", gap: 28, marginBottom: 32 }}>
            {color     && <LuckyItem label={T.luckyColor}  value={color} />}
            {number    && <LuckyItem label={T.luckyNumber} value={number} />}
            {direction && <LuckyItem label={T.luckyDirection} value={direction} />}
          </div>
        )}

        {/* 구분선 */}
        <div style={{ height: 1, background: "#ffffff10", marginBottom: 20 }} />

        {/* 하단: 흐림 상태 + 날짜 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#504058", letterSpacing: 2 }}>
              {crackLabel}
            </span>
            {/* 흐림 바 */}
            <div style={{
              width: 120, height: 3, borderRadius: 2,
              background: "#ffffff10", display: "flex",
            }}>
              <div style={{
                width: `${crackBarPct}%`, height: "100%",
                borderRadius: 2,
                background: crackInt >= 3
                  ? "#a03040"
                  : crackInt >= 2
                    ? "#806040"
                    : "#504058",
              }} />
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#40304a" }}>{date}</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}

function LuckyItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 16, color: "#8070a0" }}>{label}</span>
      <span style={{ fontSize: 24, color: "#e0d0c0" }}>{value}</span>
    </div>
  );
}
