/**
 * 운세 결과 공유 이미지 — 모던 리포트 카드.
 *
 * GET /api/share/fortune?title=...&score=85&category=...
 *     &content=...&color=보라&number=7&direction=동쪽&date=2026.05.11
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { sanitizeFortuneCopy } from "@/lib/fortune/sanitize-copy";

export const runtime = "edge";

const I18N_KO = {
  appName: "인생의 회전목마",
  scoreUnit: "점",
  defaultTitle: "오늘의 기운",
  defaultCategory: "운세",
  luckyColor: "행운의 색",
  luckyNumber: "행운의 숫자",
  luckyDirection: "행운의 방향",
  cta: "나의 오늘 운세 확인하기",
};
const I18N_EN = {
  appName: "Carousel of Life",
  scoreUnit: "pts",
  defaultTitle: "Today's flow",
  defaultCategory: "Fortune",
  luckyColor: "Lucky color",
  luckyNumber: "Lucky number",
  luckyDirection: "Lucky direction",
  cta: "Check your fortune today",
};

/** 점수대별 강조색 — 높을수록 따뜻한 골드, 낮을수록 차분한 라벤더. */
function scoreAccent(score: number): { accent: string; soft: string } {
  if (score >= 80) return { accent: "#b9954a", soft: "#ead9ad" };
  if (score >= 60) return { accent: "#497a8f", soft: "#c9dde4" };
  return { accent: "#8c6f9f", soft: "#ded0e8" };
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const locale = sp.get("locale") === "en" ? "en" : "ko";
  const T = locale === "en" ? I18N_EN : I18N_KO;

  const title = sanitizeFortuneCopy(sp.get("title") ?? T.defaultTitle);
  const score = Math.min(100, Math.max(0, Number(sp.get("score") ?? 70)));
  const category = sp.get("category") ?? T.defaultCategory;
  const content = truncate(sanitizeFortuneCopy(sp.get("content") ?? ""), 80);
  const color = sp.get("color") ?? null;
  const number = sp.get("number") ?? null;
  const direction = sp.get("direction") ?? null;
  const date = sp.get("date") ?? "";
  const readerName = sp.get("readerName")?.trim() || null;
  const rawReaderImage = sp.get("readerImage")?.trim() || null;
  const readerImage =
    rawReaderImage && rawReaderImage.startsWith("/")
      ? new URL(rawReaderImage, req.nextUrl.origin).toString()
      : rawReaderImage;

  const { accent, soft } = scoreAccent(score);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(circle at 78% 28%, #ffffff 0%, #fbfaf7 58%, #f1eee8 100%)",
          fontFamily:
            'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
          color: "#171717",
          padding: "64px 76px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: "absolute",
            top: -240,
            right: -240,
            width: 660,
            height: 660,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}1c 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
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
        {readerImage ? (
          <img
            src={readerImage}
            alt=""
            width={460}
            height={620}
            style={{
              position: "absolute",
              right: -70,
              bottom: -34,
              width: 430,
              height: 580,
              objectFit: "cover",
              objectPosition: "top center",
              borderRadius: 34,
              opacity: 0.16,
            }}
          />
        ) : null}

        {/* 상단 — 브랜딩 + 카테고리 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 48,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 5,
                color: accent,
              }}
            >
              CAROUSEL OF LIFE
            </span>
            <span style={{ fontSize: 19, color: "#71717a", letterSpacing: 2 }}>
              {T.appName}
            </span>
            {readerName ? (
              <span style={{ marginTop: 8, fontSize: 21, color: "#3f3f46" }}>
                {readerName}의 오늘 카드
              </span>
            ) : null}
          </div>
          <span
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: accent,
              background: "#ffffff",
              border: `1.5px solid ${accent}45`,
              borderRadius: 100,
              padding: "8px 26px",
              letterSpacing: 1,
            }}
          >
            {category}
          </span>
        </div>

        {/* 점수 — 큰 숫자 + 게이지 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontSize: 150,
              fontWeight: 800,
              color: accent,
              lineHeight: 0.95,
            }}
          >
            {score}
          </span>
          <span style={{ fontSize: 36, color: soft, marginBottom: 18 }}>
            {T.scoreUnit}
          </span>
        </div>
        <div
          style={{
            width: 420,
            height: 10,
            borderRadius: 6,
            background: "#e7e2d8",
            display: "flex",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: `${score}%`,
              height: "100%",
              borderRadius: 6,
              background: `linear-gradient(to right, ${accent}, ${soft})`,
            }}
          />
        </div>

        {/* 제목 */}
        <span
          style={{
            fontSize: 46,
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 22,
            color: "#171717",
          }}
        >
          {title}
        </span>

        {/* 내용 */}
        {content && (
          <span
            style={{
              fontSize: 28,
              lineHeight: 1.65,
              color: "#3f3f46",
              marginBottom: 36,
              flexGrow: 1,
            }}
          >
            {content}
          </span>
        )}

        {/* 행운 정보 칩 */}
        {(color || number || direction) && (
          <div style={{ display: "flex", gap: 18, marginBottom: 36 }}>
            {color && <LuckyChip label={T.luckyColor} value={color} accent={accent} />}
            {number && <LuckyChip label={T.luckyNumber} value={number} accent={accent} />}
            {direction && (
              <LuckyChip label={T.luckyDirection} value={direction} accent={accent} />
            )}
          </div>
        )}

        {/* 하단 워터마크 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 26,
            borderTop: `1px solid ${accent}24`,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: accent,
              letterSpacing: 1,
            }}
          >
            carouseloflife.com
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 20, color: "#71717a" }}>{T.cta}</span>
            {date ? (
              <span style={{ fontSize: 20, color: "#a1a1aa" }}>{date}</span>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}

function LuckyChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "#ffffff",
        border: `1px solid ${accent}2f`,
        borderRadius: 18,
        padding: "16px 26px",
      }}
    >
      <span style={{ fontSize: 17, color: "#71717a" }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: "#171717" }}>
        {value}
      </span>
    </div>
  );
}
