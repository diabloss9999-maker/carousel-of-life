/**
 * 채팅 Q&A 공유 이미지 — 아이돌 포토카드 스타일.
 *
 * 사용자가 멤버에게 받은 답변 한 쌍을 1080×1080 카드로 렌더링한다.
 * 멤버별 테마색 + 초상 + 말풍선 Q&A + Carousel Nine 브랜딩.
 *
 * GET /api/share/chat?c=child&q=...&a=...&locale=ko
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";

export const runtime = "edge";

/** 멤버별 포토카드 테마 — 채팅 UI 색과 통일. */
const MEMBER_THEME: Record<
  CharacterId,
  { accent: string; soft: string; bg: string }
> = {
  child:      { accent: "#f87171", soft: "#fecaca", bg: "linear-gradient(150deg,#2a0f12 0%,#170a0e 55%,#200d12 100%)" },
  witch:      { accent: "#60a5fa", soft: "#bfdbfe", bg: "linear-gradient(150deg,#0d1830 0%,#0a1020 55%,#0e1528 100%)" },
  sage:       { accent: "#fbbf24", soft: "#fde68a", bg: "linear-gradient(150deg,#291c08 0%,#171107 55%,#22180a 100%)" },
  shaman:     { accent: "#fb7185", soft: "#fecdd3", bg: "linear-gradient(150deg,#2a0d18 0%,#180a10 55%,#220d16 100%)" },
  taoist:     { accent: "#22d3ee", soft: "#a5f3fc", bg: "linear-gradient(150deg,#082530 0%,#06151c 55%,#081e26 100%)" },
  dokkaebi:   { accent: "#c084fc", soft: "#e9d5ff", bg: "linear-gradient(150deg,#1d0f30 0%,#120a1e 55%,#180d28 100%)" },
  god:        { accent: "#38bdf8", soft: "#bae6fd", bg: "linear-gradient(150deg,#0a2030 0%,#07131e 55%,#091a28 100%)" },
  hunter:     { accent: "#d6d3d1", soft: "#f5f5f4", bg: "linear-gradient(150deg,#1d1b1a 0%,#121110 55%,#181615 100%)" },
  runeshaman: { accent: "#818cf8", soft: "#c7d2fe", bg: "linear-gradient(150deg,#131434 0%,#0c0d20 55%,#10112a 100%)" },
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trim() + "…" : text;
}

function isValidCharacterId(id: string | null): id is CharacterId {
  return !!id && Object.prototype.hasOwnProperty.call(CHARACTERS, id);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const origin = url.origin;
  const locale = sp.get("locale") === "en" ? "en" : "ko";

  const rawId = sp.get("c");
  const characterId: CharacterId = isValidCharacterId(rawId) ? rawId : "witch";
  const character = CHARACTERS[characterId];

  const question = truncate(sp.get("q") ?? "", 70);
  const answer = truncate(sp.get("a") ?? "", 180);

  const theme = MEMBER_THEME[characterId];
  const appName = locale === "en" ? "Carousel of Life" : "인생의 회전목마";
  const ctaLabel =
    locale === "en" ? "Chat with all 9 members" : "9명의 멤버와 대화해보세요";
  // OG 렌더러(satori)는 webp 미지원 — 공유카드 전용 PNG 초상 사용.
  const portraitUrl = `${origin}/characters/idols/share/${characterId}.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background: theme.bg,
          color: "#f4f1ee",
          padding: "64px 72px",
          position: "relative",
          overflow: "hidden",
          fontFamily:
            'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -260,
            width: 680,
            height: 680,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}26 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -220,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}14 0%, transparent 70%)`,
          }}
        />

        {/* 상단 — 그룹 로고 라인 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 44,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: 6,
                color: theme.accent,
              }}
            >
              CAROUSEL NINE
            </span>
            <span style={{ fontSize: 19, color: "#9b96a8", letterSpacing: 2 }}>
              {appName}
            </span>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: theme.soft,
              background: `${theme.accent}1f`,
              border: `1.5px solid ${theme.accent}55`,
              borderRadius: 100,
              padding: "8px 24px",
              letterSpacing: 1,
            }}
          >
            💬 RIDER TALK
          </span>
        </div>

        {/* 본문 — 좌: 포토카드, 우: 말풍선 */}
        <div style={{ display: "flex", gap: 52, flex: 1 }}>
          {/* 멤버 포토카드 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 330,
                height: 470,
                borderRadius: 28,
                overflow: "hidden",
                border: `3px solid ${theme.accent}80`,
                boxShadow: `0 28px 64px -18px ${theme.accent}55`,
              }}
            >
              <img
                src={portraitUrl}
                alt={character.name}
                width={330}
                height={470}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{ fontSize: 40, fontWeight: 800, color: "#ffffff" }}
              >
                {character.name}
              </span>
              <span style={{ fontSize: 19, color: theme.soft, letterSpacing: 1 }}>
                {character.title}
              </span>
            </div>
          </div>

          {/* 말풍선 영역 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              justifyContent: "center",
              gap: 28,
            }}
          >
            {/* 팬 질문 — 오른쪽 정렬 말풍선 */}
            {question && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    maxWidth: "88%",
                    fontSize: 27,
                    lineHeight: 1.5,
                    color: "#171320",
                    background: "#f2eee9",
                    borderRadius: "26px 26px 8px 26px",
                    padding: "20px 28px",
                    fontWeight: 600,
                  }}
                >
                  {question}
                </span>
              </div>
            )}

            {/* 멤버 답변 — 왼쪽 말풍선 */}
            {answer && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: theme.accent,
                    letterSpacing: 1,
                  }}
                >
                  {character.name}
                </span>
                <span
                  style={{
                    fontSize: 30,
                    lineHeight: 1.55,
                    color: "#f7f4f0",
                    background: `${theme.accent}1c`,
                    border: `1.5px solid ${theme.accent}45`,
                    borderRadius: "8px 26px 26px 26px",
                    padding: "26px 32px",
                  }}
                >
                  {answer}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 하단 워터마크 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 40,
            paddingTop: 26,
            borderTop: `1px solid ${theme.accent}30`,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: theme.soft,
              letterSpacing: 1,
            }}
          >
            carouseloflife.com
          </span>
          <span style={{ fontSize: 20, color: "#9b96a8", letterSpacing: 1 }}>
            {ctaLabel}
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
