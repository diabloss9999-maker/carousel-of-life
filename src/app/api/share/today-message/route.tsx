/**
 * 최애의 오늘 한마디 — 인스타 스토리(9:16) 공유 이미지.
 *
 * GET /api/share/today-message?name=유준&opener=...&insight=...&signOff=...&tone=good&date=2026.06.21
 *
 * Co-Star 의 바이럴 공유를 "최애가 오늘 해준 말" 카드로 재해석. 순수 타이포(이미지 무첨부)
 * 라 edge ImageResponse 에서 안정적으로 렌더된다.
 */
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

type Tone = "good" | "caution" | "calm";

/** 톤별 강조색 + 라벨. */
function toneStyle(tone: Tone): { accent: string; soft: string; label: string } {
  if (tone === "good")
    return { accent: "#fbbf24", soft: "#fde68a", label: "좋은 흐름" };
  if (tone === "caution")
    return { accent: "#f9a8d4", soft: "#fbcfe8", label: "조심한 하루" };
  return { accent: "#7dd3fc", soft: "#bae6fd", label: "잔잔한 하루" };
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const name = truncate(sp.get("name") ?? "캐러셀나인", 10);
  const opener = truncate(sp.get("opener") ?? "", 40);
  const insight = truncate(sp.get("insight") ?? "오늘도 좋은 하루 보내요.", 70);
  const signOff = truncate(sp.get("signOff") ?? "", 40);
  const toneParam = sp.get("tone");
  const tone: Tone =
    toneParam === "good" || toneParam === "caution" ? toneParam : "calm";
  const date = sp.get("date") ?? "";

  const { accent, soft, label } = toneStyle(tone);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(165deg, #15101f 0%, #0c0915 55%, #130f22 100%)",
          fontFamily:
            'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
          color: "#f4f1ee",
          padding: "120px 96px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -220,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -240,
            left: -240,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
          }}
        />

        {/* 상단 브랜딩 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 6,
              color: accent,
            }}
          >
            CAROUSEL OF LIFE
          </span>
          <span style={{ fontSize: 24, color: "#9b96a8", letterSpacing: 2 }}>
            오늘의 한마디
          </span>
        </div>

        {/* 본문 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: soft,
              background: `${accent}1f`,
              border: `2px solid ${accent}55`,
              borderRadius: 100,
              padding: "12px 34px",
              alignSelf: "flex-start",
              marginBottom: 40,
            }}
          >
            {label}
          </span>

          <span
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              marginBottom: 36,
            }}
          >
            {name}
          </span>

          {opener ? (
            <span
              style={{
                fontSize: 38,
                fontWeight: 600,
                color: "#e7e2ea",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {opener}
            </span>
          ) : null}

          <span
            style={{
              fontSize: 44,
              color: "#cfc8d4",
              lineHeight: 1.6,
              marginBottom: 36,
            }}
          >
            {insight}
          </span>

          {signOff ? (
            <span
              style={{
                fontSize: 34,
                color: soft,
                lineHeight: 1.5,
              }}
            >
              “{signOff}” — {name}
            </span>
          ) : null}
        </div>

        {/* 하단 워터마크 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 34,
            borderTop: `1px solid ${accent}30`,
          }}
        >
          <span
            style={{ fontSize: 28, fontWeight: 700, color: soft, letterSpacing: 1 }}
          >
            carouseloflife.com
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 26, color: "#9b96a8" }}>
              내 최애의 한마디 받기
            </span>
            {date ? (
              <span style={{ fontSize: 24, color: "#6f6a7c" }}>{date}</span>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
