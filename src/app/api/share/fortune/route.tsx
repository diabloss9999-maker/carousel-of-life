/**
 * 운세 결과 공유 이미지 생성 API.
 *
 * GET /api/share/fortune?title=...&score=85&category=오늘의운세&content=...
 *     &color=보라&number=7&direction=동쪽&date=2026.05.11
 *
 * 1080×1080 PNG 이미지를 반환한다.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/** 점수 → 색상 */
function scoreColor(score: number): string {
  if (score >= 80) return "#c8a96e"; // gold
  if (score >= 60) return "#7c9fd4"; // blue
  return "#a07070";                   // muted red
}

/** 긴 텍스트 말줄임 */
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const title     = sp.get("title")     ?? "오늘의 운세";
  const score     = Math.min(100, Math.max(0, Number(sp.get("score") ?? 70)));
  const category  = sp.get("category")  ?? "운세";
  const content   = truncate(sp.get("content") ?? "", 72);
  const color     = sp.get("color")     ?? null;
  const number    = sp.get("number")    ?? null;
  const direction = sp.get("direction") ?? null;
  const date      = sp.get("date")      ?? "";

  const accent = scoreColor(score);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #1a1025 0%, #0d0818 55%, #12091e 100%)",
          fontFamily: '"Noto Serif KR", "Malgun Gothic", serif',
          color: "#f0e8d8",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 장식 원 */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, #4a306818 0%, transparent 70%)",
          }}
        />

        {/* 상단: 앱 이름 + 카테고리 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 56 }}>
          <span style={{ fontSize: 26, color: "#a090b0", letterSpacing: 2 }}>
            인생의 회전목마
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
            {category}
          </span>
        </div>

        {/* 점수 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 32 }}>
          <span style={{ fontSize: 120, fontWeight: 700, color: accent, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 36, color: `${accent}aa`, marginBottom: 18 }}>점</span>
        </div>

        {/* 구분선 */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(to right, ${accent}80, transparent)`,
            marginBottom: 36,
          }}
        />

        {/* 제목 */}
        <p
          style={{
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: 28,
            color: "#f5ecd8",
          }}
        >
          {title}
        </p>

        {/* 내용 요약 */}
        {content && (
          <p
            style={{
              fontSize: 28,
              lineHeight: 1.6,
              color: "#c8b8a8",
              marginBottom: 40,
              flexGrow: 1,
            }}
          >
            {content}
          </p>
        )}

        {/* 구분선 */}
        <div
          style={{
            height: 1,
            background: "#ffffff18",
            marginBottom: 32,
          }}
        />

        {/* 행운 정보 */}
        {(color || number || direction) && (
          <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
            {color && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 18, color: "#8070a0" }}>행운의 색</span>
                <span style={{ fontSize: 26, color: "#e0d0c0" }}>{color}</span>
              </div>
            )}
            {number && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 18, color: "#8070a0" }}>행운의 숫자</span>
                <span style={{ fontSize: 26, color: "#e0d0c0" }}>{number}</span>
              </div>
            )}
            {direction && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 18, color: "#8070a0" }}>행운의 방향</span>
                <span style={{ fontSize: 26, color: "#e0d0c0" }}>{direction}</span>
              </div>
            )}
          </div>
        )}

        {/* 하단 날짜 */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 20, color: "#60506a" }}>{date}</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    },
  );
}
