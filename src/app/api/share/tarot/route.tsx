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

  const accent = "#b9954a";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background: "radial-gradient(circle at 76% 26%, #ffffff 0%, #fbfaf7 58%, #f1eee8 100%)",
          fontFamily: 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
          color: "#171717",
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
            background: "radial-gradient(circle, #b9954a18 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 42,
            border: "1.5px solid #e7e2d8",
            borderRadius: 42,
            background: "#ffffffaa",
          }}
        />

        {/* 상단: 앱 이름 + 스프레드 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 64 }}>
          <span style={{ fontSize: 26, color: "#71717a", letterSpacing: 2 }}>
            {T.appName}
          </span>
          <span
            style={{
              fontSize: 20,
              color: accent,
              background: "#ffffff",
              border: `1.5px solid ${accent}45`,
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
              color: "#171717",
              lineHeight: 1,
            }}
          >
            {card}
          </span>
          {reversed && (
            <span
              style={{
                fontSize: 24,
                color: "#8c6f9f",
                background: "#ffffff",
                border: "1.5px solid #8c6f9f45",
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
              color: "#3f3f46",
              flexGrow: 1,
            }}
          >
            {summary}
          </p>
        )}

        {/* 하단 날짜 */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 20, color: "#a1a1aa" }}>{date}</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
