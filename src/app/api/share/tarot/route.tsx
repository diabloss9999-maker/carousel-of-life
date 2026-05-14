/**
 * 타로 결과 공유 이미지 생성 API.
 *
 * GET /api/share/tarot?card=달&reversed=false&summary=...&date=2026.05.11
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

const I18N_KO_T = {
  appName: "인생의 회전목마",
  tarotLabel: "타로",
  defaultSpread: "한 장",
  defaultCard: "타로",
  reversed: "역방향",
};
const I18N_EN_T = {
  appName: "Carousel of Life",
  tarotLabel: "Tarot",
  defaultSpread: "1 card",
  defaultCard: "Tarot",
  reversed: "Reversed",
};

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const locale = sp.get("locale") === "en" ? "en" : "ko";
  const T = locale === "en" ? I18N_EN_T : I18N_KO_T;

  const card     = sp.get("card")     ?? T.defaultCard;
  const reversed = sp.get("reversed") === "true";
  const summary  = truncate(sp.get("summary") ?? "", 60);
  const spread   = sp.get("spread")   ?? T.defaultSpread;
  const date     = sp.get("date")     ?? "";

  const accent = "#c8a96e";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #0f1825 0%, #09101d 55%, #0e1520 100%)",
          fontFamily: '"Noto Serif KR", "Malgun Gothic", serif',
          color: "#f0e8d8",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, #c8a96e14 0%, transparent 70%)",
          }}
        />

        {/* 상단: 앱 이름 + 스프레드 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 64 }}>
          <span style={{ fontSize: 26, color: "#90809a", letterSpacing: 2 }}>
            {T.appName}
          </span>
          <span
            style={{
              fontSize: 20,
              color: accent,
              border: `1.5px solid ${accent}60`,
              borderRadius: 100,
              padding: "6px 20px",
              letterSpacing: 1,
            }}
          >
            {T.tarotLabel} · {spread}
          </span>
        </div>

        {/* 카드명 */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: "#f5ecd8",
              lineHeight: 1,
            }}
          >
            {card}
          </span>
          {reversed && (
            <span
              style={{
                fontSize: 24,
                color: "#a07070",
                border: "1.5px solid #a0707060",
                borderRadius: 100,
                padding: "4px 16px",
              }}
            >
              {T.reversed}
            </span>
          )}
        </div>

        {/* 구분선 */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(to right, ${accent}80, transparent)`,
            marginBottom: 48,
          }}
        />

        {/* 요약 */}
        {summary && (
          <p
            style={{
              fontSize: 34,
              lineHeight: 1.65,
              color: "#c8b8a8",
              flexGrow: 1,
            }}
          >
            {summary}
          </p>
        )}

        {/* 하단 날짜 */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 20, color: "#50405a" }}>{date}</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
