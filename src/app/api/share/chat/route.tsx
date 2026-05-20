/**
 * 채팅 풀이 결과 공유 이미지 생성 API.
 *
 * 사용자가 채팅에서 받은 Q&A 한 쌍을 1080×1080 OG 카드로 렌더링한다.
 * 캐릭터 초상 + 질문 한 줄 + 캐릭터 답변 발췌 + 워터마크.
 *
 * GET /api/share/chat?c=child&q=...&a=...&locale=ko
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";

export const runtime = "edge";

/** 캐릭터별 카드 톤 — 카테고리에 맞춰 강조색을 정한다. */
const ACCENT_BY_CATEGORY = {
  이세계: { accent: "#c8a96e", sub: "#90809a", bg: "linear-gradient(160deg,#0f1825 0%,#09101d 55%,#0e1520 100%)" },
  동양:   { accent: "#9bd4a8", sub: "#7aa382", bg: "linear-gradient(160deg,#0c1a14 0%,#08110d 55%,#0c1612 100%)" },
  북유럽: { accent: "#8fb8e8", sub: "#7a8fa8", bg: "linear-gradient(160deg,#0e1722 0%,#080d14 55%,#0d141f 100%)" },
} as const;

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
  const answer   = truncate(sp.get("a") ?? "", 200);

  const theme = ACCENT_BY_CATEGORY[character.category];
  const appName = locale === "en" ? "Carousel of Life" : "인생의 회전목마";
  const askLabel = locale === "en" ? "Q." : "물음.";
  const replyLabel = locale === "en" ? `— ${character.name}` : `— ${character.name}`;
  const portraitUrl = origin + character.imageSrc;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          background: theme.bg,
          color: "#f0e8d8",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
          fontFamily: '"Noto Serif KR", "Malgun Gothic", serif',
        }}
      >
        {/* 배경 라이트 */}
        <div
          style={{
            position: "absolute",
            top: -240,
            right: -240,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}1a 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}10 0%, transparent 70%)`,
          }}
        />

        {/* 상단 — 앱 이름 + 카테고리 배지 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 26, color: theme.sub, letterSpacing: 2 }}>{appName}</span>
          <span
            style={{
              fontSize: 20,
              color: theme.accent,
              border: `1.5px solid ${theme.accent}60`,
              borderRadius: 100,
              padding: "6px 22px",
              letterSpacing: 1,
            }}
          >
            {character.category} · {character.specialty}
          </span>
        </div>

        {/* 본문 — 좌: 초상, 우: 텍스트 */}
        <div style={{ display: "flex", gap: 56, flex: 1 }}>
          {/* 캐릭터 초상 */}
          <div
            style={{
              display: "flex",
              width: 320,
              height: 480,
              borderRadius: 24,
              overflow: "hidden",
              border: `1.5px solid ${theme.accent}40`,
              boxShadow: `0 24px 48px -16px ${theme.accent}30`,
              flexShrink: 0,
            }}
          >
            <img
              src={portraitUrl}
              alt={character.name}
              width={320}
              height={480}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* 텍스트 영역 */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            {/* 캐릭터 이름 + 직함 */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 36 }}>
              <span style={{ fontSize: 56, fontWeight: 700, color: "#f5ecd8", lineHeight: 1, marginBottom: 10 }}>
                {character.name}
              </span>
              <span style={{ fontSize: 22, color: theme.sub, letterSpacing: 1 }}>{character.title}</span>
            </div>

            {/* 질문 */}
            {question && (
              <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
                <span style={{ fontSize: 18, color: theme.accent, letterSpacing: 2, marginBottom: 8 }}>
                  {askLabel}
                </span>
                <span style={{ fontSize: 28, color: "#d8cdb8", lineHeight: 1.45 }}>{question}</span>
              </div>
            )}

            {/* 구분선 */}
            <div
              style={{
                height: 1,
                background: `linear-gradient(to right, ${theme.accent}80, transparent)`,
                marginBottom: 28,
              }}
            />

            {/* 답변 발췌 */}
            {answer && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: 30, lineHeight: 1.5, color: "#ece2d0" }}>{answer}</span>
              </div>
            )}

            {/* 캐릭터 서명 */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <span style={{ fontSize: 24, color: theme.accent, letterSpacing: 1, fontStyle: "italic" }}>
                {replyLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 하단 워터마크 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 36,
            paddingTop: 24,
            borderTop: `1px solid ${theme.accent}20`,
          }}
        >
          <span style={{ fontSize: 20, color: theme.sub, letterSpacing: 1 }}>carouseloflife.com</span>
          <span style={{ fontSize: 18, color: theme.sub, letterSpacing: 2 }}>
            {locale === "en" ? "Ask your oracle" : "너만의 점술사에게 물어봐"}
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
